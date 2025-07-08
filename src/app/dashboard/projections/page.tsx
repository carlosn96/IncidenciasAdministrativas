
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSettings } from "@/context/settings-context";
import type { Period, LaborDay, Incident, Schedule, DaySchedule, Location } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO, differenceInMinutes, getDay, isBefore, startOfDay, isAfter, isWithinInterval, endOfDay, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Save, PlusCircle, BrainCircuit, AlertTriangle, UploadCloud, Loader2, Check, CalendarSync, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { v4 as uuidv4 } from "uuid";
import { manageCalendarEvent } from "@/lib/actions";

type CalendarChangeAction = 'create' | 'update' | 'delete';
type CalendarChange = {
    action: CalendarChangeAction;
    date: string;
    incidentType: 'projectedEntry' | 'projectedExit';
    eventId?: string; // For update/delete
    summary?: string; // For create/update
    location?: string; // For create/update
    startTime?: Date; // For create/update
};


// Helper functions
const calculateMinutes = (entry?: Incident, exit?: Incident): number => {
  if (!entry?.time || !exit?.time || !entry.location || !exit.location) return 0;
  const [startHour, startMinute] = entry.time.split(":").map(Number);
  const [endHour, endMinute] = exit.time.split(":").map(Number);
  const startDate = new Date(0);
  startDate.setHours(startHour, startMinute, 0, 0);
  const endDate = new Date(0);
  endDate.setHours(endHour, endMinute, 0, 0);
  const diff = differenceInMinutes(endDate, startDate);
  return diff > 0 ? diff : 0;
};

const formatMinutesToHours = (totalMinutes: number): string => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${isNegative ? '-' : ''}${hours}h ${minutes}m`;
};

const daysOfWeekSpanish = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function ProjectionsPage() {
  const searchParams = useSearchParams();
  const { periods, setPeriods, userLocations, schedules, activeScheduleId, setSchedules } = useSettings();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [projections, setProjections] = useState<LaborDay[]>([]);
  const [originalProjectionsForCompare, setOriginalProjectionsForCompare] = useState<LaborDay[]>([]);
  const { toast } = useToast();
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const todayString = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === activeScheduleId);
  }, [schedules, activeScheduleId]);

  useEffect(() => {
    const periodIdFromUrl = searchParams.get("period");

    if (periodIdFromUrl && periods.some(p => p.id === periodIdFromUrl)) {
      setSelectedPeriodId(periodIdFromUrl);
      return;
    }

    const today = new Date();
    const activePeriod = periods.find(p => isWithinInterval(today, { start: p.startDate, end: endOfDay(p.endDate) }));

    if (activePeriod) {
      setSelectedPeriodId(activePeriod.id);
    } else if (periods.length > 0) {
      const sortedPeriods = [...periods].sort((a,b) => b.startDate.getTime() - a.startDate.getTime());
      setSelectedPeriodId(sortedPeriods[0].id);
    }
  }, [searchParams, periods]);

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId);
  }, [selectedPeriodId, periods]);


  const applyScheduleToProjections = useCallback((overwrite = false) => {
    if (!projections.length || !activeSchedule) {
      if (!activeSchedule) {
        toast({
          variant: 'destructive',
          title: 'Sin Horario Activo',
          description: 'No tienes una plantilla de horario activa para cargar. Ve a Ajustes > Horarios para seleccionar una.',
          duration: 10000,
        });
      }
      return;
    }

    const newProjections = projections.map(day => {
        const newDay = JSON.parse(JSON.stringify(day)); 
        
        const isPastDay = isBefore(parseISO(day.date), startOfDay(new Date()));
        if (isPastDay && newDay.entry) {
            return newDay;
        }

        const dayDate = parseISO(day.date);
        const dayOfWeekIndex = getDay(dayDate);
        const dayName = daysOfWeekSpanish[dayOfWeekIndex] as DaySchedule['day'];
        const scheduleForDay = activeSchedule.entries.find(e => e.day === dayName);
        
        if (!scheduleForDay) {
            if (overwrite) {
                delete newDay.projectedEntry;
                delete newDay.projectedExit;
            }
            return newDay;
        }
        
        if (scheduleForDay.startTime && scheduleForDay.startLocation) {
            newDay.projectedEntry = { time: scheduleForDay.startTime, location: scheduleForDay.startLocation };
        } else {
          delete newDay.projectedEntry;
        }

        if (scheduleForDay.endTime && scheduleForDay.endLocation) {
            newDay.projectedExit = { time: scheduleForDay.endTime, location: scheduleForDay.endLocation };
        } else {
          delete newDay.projectedExit;
        }
        
        return newDay;
    });

    setProjections(newProjections);
    if(overwrite) {
      toast({ title: "Horario Cargado", description: "La proyección se ha actualizado con tu horario por defecto."})
    }
  }, [projections, activeSchedule, toast]);

  useEffect(() => {
    if (selectedPeriod) {
        // Take a "photo" of the initial state for comparison later.
        setOriginalProjectionsForCompare(JSON.parse(JSON.stringify(selectedPeriod.laborDays)));
        
        // This is the state that will be modified by the user.
        setProjections(JSON.parse(JSON.stringify(selectedPeriod.laborDays)));
    } else {
        setProjections([]);
        setOriginalProjectionsForCompare([]);
    }
  }, [selectedPeriod]);

  const handleProjectionChange = (
    date: string,
    type: "projectedEntry" | "projectedExit",
    field: "time" | "location",
    value: string
  ) => {
    setProjections((prevProjections) =>
      prevProjections.map((day) => {
        if (day.date === date) {
          const updatedDay = { ...day };
          if (!updatedDay[type]) {
            updatedDay[type] = { time: "", location: "" };
          }
          updatedDay[type]![field] = value;
          
          if(field === 'time' && value === '') {
            if(updatedDay[type]?.location === '') {
                delete updatedDay[type];
            }
          }
           if(field === 'location' && value === '') {
            if(updatedDay[type]?.time === '') {
                delete updatedDay[type];
            }
          }

          return updatedDay;
        }
        return day;
      })
    );
  };

  const determineChanges = (original: LaborDay[], current: LaborDay[]) => {
    const changes: CalendarChange[] = [];

    current.forEach((newDay, index) => {
      const originalDay = original[index];
      if (!originalDay || originalDay.date !== newDay.date) return;

      const processIncidentType = (type: 'projectedEntry' | 'projectedExit') => {
        const originalIncident = originalDay[type];
        const newIncident = newDay[type];
        const incidentTypeLabel = type === 'projectedEntry' ? 'ENTRADA' : 'SALIDA';

        const hasOriginalData = !!(originalIncident?.time && originalIncident?.location);
        const hasNewData = !!(newIncident?.time && newIncident?.location);
        const originalEventId = originalIncident?.calendarEventId;

        // CREATE: Was empty, now has data. Or had data but was never synced.
        if ((!hasOriginalData && hasNewData) || (hasOriginalData && hasNewData && !originalEventId)) {
          changes.push({
            action: 'create',
            date: newDay.date,
            incidentType: type,
            summary: `${incidentTypeLabel}: ${newIncident.location}`,
            location: newIncident.location,
            startTime: new Date(`${newDay.date}T${newIncident.time}`),
          });
        }
        // DELETE: Had data (and was synced), now is empty.
        else if (hasOriginalData && !hasNewData && originalEventId) {
          changes.push({
            action: 'delete',
            date: newDay.date,
            incidentType: type,
            eventId: originalEventId,
          });
        }
        // UPDATE: Had data (and was synced), and still has data, and it's different.
        else if (
          hasOriginalData &&
          hasNewData &&
          originalEventId &&
          (originalIncident.time !== newIncident.time || originalIncident.location !== newIncident.location)
        ) {
          changes.push({
            action: 'update',
            date: newDay.date,
            incidentType: type,
            eventId: originalEventId,
            summary: `${incidentTypeLabel}: ${newIncident.location}`,
            location: newIncident.location,
            startTime: new Date(`${newDay.date}T${newIncident.time}`),
          });
        }
      };

      processIncidentType('projectedEntry');
      processIncidentType('projectedExit');
    });

    return changes;
  };


  const syncCalendarEvents = async (originalProjections: LaborDay[], newProjections: LaborDay[]) => {
    if (!googleCalendarId) {
      toast({
          variant: "destructive",
          title: "Error de Configuración",
          description: "La variable NEXT_PUBLIC_GOOGLE_CALENDAR_ID no se encontró. Por favor, añádela a tu archivo .env y REINICIA el servidor.",
          duration: 15000,
      });
      return { success: false, finalProjections: newProjections };
    }
    
    const changesToSync = determineChanges(originalProjections, newProjections);
    if (changesToSync.length === 0) {
        return { success: true, finalProjections: newProjections };
    }

    const updatedProjections = JSON.parse(JSON.stringify(newProjections));

    const syncPromises = changesToSync.map(async (change) => {
        const startTime = change.startTime;
        const endTime = startTime ? addMinutes(startTime, 30) : undefined;
        
        const result = await manageCalendarEvent({
            action: change.action,
            calendarId: googleCalendarId,
            eventId: change.eventId,
            summary: change.summary,
            location: change.location,
            start: startTime?.toISOString(),
            end: endTime?.toISOString(),
        });
        
        if (result.success) {
            const dayIndex = updatedProjections.findIndex((d: LaborDay) => d.date === change.date);
            if (dayIndex !== -1) {
                const day = updatedProjections[dayIndex];
                const incident = day[change.incidentType];
                if (change.action === 'create' || change.action === 'update') {
                    if (incident) incident.calendarEventId = result.eventId;
                } else if (change.action === 'delete') {
                    if (incident) delete incident.calendarEventId;
                }
            }
        } else {
             toast({ variant: 'destructive', title: `Error al ${change.action} evento (${change.date})`, description: result.error, duration: 15000 });
        }
    });

    await Promise.all(syncPromises);
    
    return { success: true, finalProjections: updatedProjections };
  };

  const handleSaveChanges = async (syncCalendar: boolean) => {
    if (!selectedPeriodId || !selectedPeriod) {
        return;
    }

    setSaveState('saving');
    let finalProjections = projections;

    if (syncCalendar) {
        toast({ title: "Sincronizando con Google Calendar...", description: "Por favor, espera un momento." });
        const syncResult = await syncCalendarEvents(originalProjectionsForCompare, projections);
        finalProjections = syncResult.finalProjections;
    }

    const cleanedProjections = finalProjections.map(day => {
        const cleanedDay = {...day};
        if (cleanedDay.projectedEntry && (!cleanedDay.projectedEntry.time || !cleanedDay.projectedEntry.location)) {
            delete cleanedDay.projectedEntry;
        }
        if (cleanedDay.projectedExit && (!cleanedDay.projectedExit.time || !cleanedDay.projectedExit.location)) {
            delete cleanedDay.projectedExit;
        }
        return cleanedDay;
    });

    setPeriods(prevPeriods =>
      prevPeriods.map(p => {
        if (p.id === selectedPeriodId) {
          return { ...p, laborDays: cleanedProjections };
        }
        return p;
      })
    );
    
    // Update the "original" state to match the newly saved state for the next comparison.
    setOriginalProjectionsForCompare(cleanedProjections);
    setProjections(cleanedProjections);

    setSaveState('saved');
    setTimeout(() => {
        setSaveState('idle');
        toast({ title: "Proyección Guardada", description: "Tus cambios han sido guardados exitosamente." });
    }, 1500);
  };
  
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
        toast({ variant: 'destructive', title: 'Nombre Requerido', description: 'Por favor, dale un nombre a tu nueva plantilla de horario.' });
        return;
    }
    if (schedules.some(s => s.name.toLowerCase() === newTemplateName.trim().toLowerCase())) {
        toast({ variant: 'destructive', title: 'Nombre Duplicado', description: 'Ya existe una plantilla con este nombre. Por favor, elige otro.' });
        return;
    }

    const newEntries: DaySchedule[] = daysOfWeekSpanish.slice(1, 7).map((dayName) => {
        const dayInProjection = projections.find(p => format(parseISO(p.date), 'EEEE', { locale: es }) === dayName);
        const entry = dayInProjection?.projectedEntry || dayInProjection?.entry;
        const exit = dayInProjection?.projectedExit || dayInProjection?.exit;

        return {
            day: dayName as DaySchedule['day'],
            startTime: entry?.time || "",
            startLocation: entry?.location || "",
            endTime: exit?.time || "",
            endLocation: exit?.location || ""
        };
    });

    const newSchedule: Schedule = {
        id: uuidv4(),
        name: newTemplateName.trim(),
        entries: newEntries
    };

    setSchedules(prev => {
        const updatedSchedules = [...prev, newSchedule];
        return updatedSchedules;
    });
    toast({ title: "Plantilla Guardada", description: `La plantilla '${newTemplateName.trim()}' ha sido creada y seleccionada como activa.` });
    
    setIsSaveTemplateOpen(false);
    setNewTemplateName("");
  };

  const checkDeviation = (day: LaborDay): string | null => {
    if (!activeSchedule) return null;
    const dayDate = parseISO(day.date);
    const dayOfWeekIndex = getDay(dayDate);
    const dayName = daysOfWeekSpanish[dayOfWeekIndex] as DaySchedule['day'];
    const scheduleForDay = activeSchedule.entries.find(e => e.day === dayName);
    
    if (!scheduleForDay || (!scheduleForDay.startTime && !scheduleForDay.startLocation)) return null;

    const entry = day.projectedEntry || day.entry;
    const exit = day.projectedExit || day.exit;
    
    let deviations: string[] = [];
    if (entry && (entry.time !== scheduleForDay.startTime || entry.location !== scheduleForDay.startLocation)) {
        deviations.push("entrada");
    }
    if (exit && (exit.time !== scheduleForDay.endTime || exit.location !== scheduleForDay.endLocation)) {
        deviations.push("salida");
    }
    
    if (deviations.length === 0) return null;
    return `La ${deviations.join(' y ')} proyectada(s) difiere(n) del horario por defecto.`;
  };

  const stats = useMemo(() => {
    if (!selectedPeriod || projections.length === 0) return null;
    const totalMinutesExpected = selectedPeriod.totalDurationMinutes || 0;
    const totalMinutesActual = projections.reduce((total, day) => total + calculateMinutes(day.entry, day.exit), 0);
    const totalMinutesProjected = projections.reduce((total, day) => {
        const entry = day.entry || day.projectedEntry;
        const exit = day.exit || day.projectedExit;
        return total + calculateMinutes(entry, exit);
    }, 0);
    const difference = totalMinutesProjected - totalMinutesExpected;
    return {
      expected: formatMinutesToHours(totalMinutesExpected),
      actual: formatMinutesToHours(totalMinutesActual),
      projected: formatMinutesToHours(totalMinutesProjected),
      difference: formatMinutesToHours(difference),
      differenceMinutes: difference,
    };
  }, [selectedPeriod, projections]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Planificador de Periodo</h1>
        <p className="text-muted-foreground">
          Proyecta tus horas de trabajo para planificar tu quincena y asegurar que cumples tus metas.
        </p>
      </div>

      <Card>
        {periods.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground border rounded-lg border-dashed">
              <BarChart className="h-12 w-12 mb-4 text-muted-foreground/50"/>
              <p className="font-medium">Aún no has creado periodos.</p>
              <p className="text-sm">Ve a <Link href="/dashboard/settings?tab=periods" className="underline font-semibold">Ajustes de Periodos</Link> para empezar.</p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="flex flex-row flex-wrap justify-between items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <CardTitle>Selecciona un Periodo</CardTitle>
                <div className="max-w-sm pt-2">
                  <Select onValueChange={setSelectedPeriodId} value={selectedPeriodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un periodo para planificar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={() => applyScheduleToProjections(true)} disabled={!selectedPeriod || !activeSchedule}>
                   <BrainCircuit className="mr-2 h-4 w-4" />
                   Cargar Horario por Defecto
                 </Button>
                  <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                    <DialogTrigger asChild>
                       <Button variant="outline" disabled={!selectedPeriod}>
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Guardar como Plantilla
                       </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Guardar Proyección como Plantilla</DialogTitle>
                        <DialogDescription>
                          Crea una nueva plantilla de horario reutilizable basada en tu planificación actual.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-2">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input
                          id="template-name"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="Ej: Horario de Verano"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveAsTemplate}>Guardar Plantilla</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>
            </CardHeader>
            {selectedPeriod ? (
              <CardContent className="space-y-6">
                {stats && (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Meta Periodo</p>
                                <p className="text-lg md:text-xl font-bold">{stats.expected}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Horas Reales</p>
                                <p className="text-lg md:text-xl font-bold">{stats.actual}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Proyectado</p>
                                <p className="text-lg md:text-xl font-bold">{stats.projected}</p>
                            </div>
                            <div className={cn(stats.differenceMinutes < 0 ? "text-destructive" : "text-green-600")}>
                                <p className="text-sm">Balanza</p>
                                <p className="text-lg md:text-xl font-bold">{stats.difference}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                <TooltipProvider>
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Fecha</TableHead>
                            <TableHead>Hora Entrada</TableHead>
                            <TableHead>Lugar Entrada</TableHead>
                            <TableHead>Hora Salida</TableHead>
                            <TableHead>Lugar Salida</TableHead>
                            <TableHead className="text-right">Horas Proyectadas</TableHead>
                            <TableHead className="text-right">Horas Reales</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projections.map((day) => {
                            const deviationMessage = checkDeviation(day);
                            const isToday = day.date === todayString;

                            const entryTimeValue = (day.entry?.time || day.projectedEntry?.time) ?? "";
                            const entryLocationValue = day.entry?.location || day.projectedEntry?.location;
                            const isEntryManual = !!entryLocationValue && !userLocations.some(l => l.name === entryLocationValue);
                            const entrySelectValue = isEntryManual ? 'manual' : entryLocationValue ?? "";

                            const exitTimeValue = (day.exit?.time || day.projectedExit?.time) ?? "";
                            const exitLocationValue = day.exit?.location || day.projectedExit?.location;
                            const isExitManual = !!exitLocationValue && !userLocations.some(l => l.name === exitLocationValue);
                            const exitSelectValue = isExitManual ? 'manual' : exitLocationValue ?? "";

                            return (
                                <TableRow key={day.date} className={cn(day.entry && day.exit && "bg-green-500/10")}>
                                    <TableCell className="font-medium capitalize whitespace-nowrap">
                                      <div className="flex items-center gap-2.5">
                                        {isToday && (
                                            <span className="relative flex h-2.5 w-2.5" title="Hoy">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                            </span>
                                        )}
                                        <span>{format(parseISO(day.date), "EEEE, d", { locale: es })}</span>
                                        {deviationMessage && (
                                          <Tooltip>
                                            <TooltipTrigger asChild><button><AlertTriangle className="h-4 w-4 text-amber-500" /></button></TooltipTrigger>
                                            <TooltipContent><p>{deviationMessage}</p></TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-1 py-2">
                                        <div className="relative flex items-center">
                                            <Input
                                                type="time"
                                                className={cn(
                                                    "min-w-[100px]",
                                                    !!day.projectedEntry?.calendarEventId && !day.entry && "pl-8"
                                                )}
                                                value={entryTimeValue}
                                                onChange={e => handleProjectionChange(day.date, 'projectedEntry', 'time', e.target.value)}
                                                disabled={!!day.entry}
                                            />
                                            {day.projectedEntry?.calendarEventId && !day.entry && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-600 cursor-help outline-none ring-ring focus-visible:ring-2 rounded-sm">
                                                            <CalendarCheck className="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Evento de entrada sincronizado.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-1 py-2">
                                      <div className="space-y-1">
                                        <Select 
                                          value={entrySelectValue} 
                                          onValueChange={v => {
                                            if (v === 'manual') {
                                              if (!isEntryManual) handleProjectionChange(day.date, 'projectedEntry', 'location', '');
                                            } else {
                                              handleProjectionChange(day.date, 'projectedEntry', 'location', v);
                                            }
                                          }} 
                                          disabled={!!day.entry}
                                        >
                                          <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                          <SelectContent>
                                            {userLocations.map(l => <SelectItem key={`${l.id}-proj-entry`} value={l.name}>{l.name}</SelectItem>)}
                                            <SelectItem value="manual">Otro (especificar)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {entrySelectValue === 'manual' && (
                                          <Input
                                            type="text"
                                            className="min-w-[150px]"
                                            placeholder="Escribe la ubicación"
                                            value={entryLocationValue ?? ""}
                                            onChange={e => handleProjectionChange(day.date, 'projectedEntry', 'location', e.target.value)}
                                            disabled={!!day.entry}
                                          />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-1 py-2">
                                        <div className="relative flex items-center">
                                            <Input
                                                type="time"
                                                className={cn(
                                                    "min-w-[100px]",
                                                    !!day.projectedExit?.calendarEventId && !day.exit && "pl-8"
                                                )}
                                                value={exitTimeValue}
                                                onChange={e => handleProjectionChange(day.date, 'projectedExit', 'time', e.target.value)}
                                                disabled={!!day.exit}
                                            />
                                            {day.projectedExit?.calendarEventId && !day.exit && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="absolute left-2.5 top-1/2 -translate-y-1/2 text-green-600 cursor-help outline-none ring-ring focus-visible:ring-2 rounded-sm">
                                                            <CalendarCheck className="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Evento de salida sincronizado.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-1 py-2">
                                       <div className="space-y-1">
                                        <Select 
                                          value={exitSelectValue} 
                                          onValueChange={v => {
                                            if (v === 'manual') {
                                              if (!isExitManual) handleProjectionChange(day.date, 'projectedExit', 'location', '');
                                            } else {
                                              handleProjectionChange(day.date, 'projectedExit', 'location', v);
                                            }
                                          }} 
                                          disabled={!!day.exit}
                                        >
                                          <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                          <SelectContent>
                                            {userLocations.map(l => <SelectItem key={`${l.id}-proj-exit`} value={l.name}>{l.name}</SelectItem>)}
                                            <SelectItem value="manual">Otro (especificar)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {exitSelectValue === 'manual' && (
                                          <Input
                                            type="text"
                                            className="min-w-[150px]"
                                            placeholder="Escribe la ubicación"
                                            value={exitLocationValue ?? ""}
                                            onChange={e => handleProjectionChange(day.date, 'projectedExit', 'location', e.target.value)}
                                            disabled={!!day.exit}
                                          />
                                        )}
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{formatMinutesToHours(calculateMinutes(day.projectedEntry || day.entry, day.projectedExit || day.exit))}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">{formatMinutesToHours(calculateMinutes(day.entry, day.exit))}</TableCell>
                                </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                </TooltipProvider>

                <div className="flex justify-end pt-6 items-center gap-2">
                    <Button variant="outline" onClick={() => handleSaveChanges(false)} disabled={!selectedPeriod || saveState !== 'idle'} className="w-[180px]">
                        {saveState === 'saving' ? <><Loader2 className="animate-spin" /> Guardando...</>
                        : saveState === 'saved' ? <><Check /> Guardado</>
                        : <><Save /> Guardar Cambios</>}
                    </Button>
                    <Button onClick={() => handleSaveChanges(true)} disabled={!selectedPeriod || saveState !== 'idle' } className="w-[240px] bg-green-600 hover:bg-green-700">
                        {saveState === 'saving' ? <><Loader2 className="animate-spin" /> Sincronizando...</>
                        : saveState === 'saved' ? <><Check /> Sincronizado</>
                        : <><CalendarSync /> Guardar y Sincronizar</>}
                    </Button>
                </div>
              </CardContent>
            ) : (
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground border rounded-lg border-dashed">
                        <BarChart className="h-12 w-12 mb-4 text-muted-foreground/50"/>
                        <p className="font-medium">No has seleccionado un periodo.</p>
                        <p className="text-sm">Por favor, elige un periodo de la lista de arriba para empezar a planificar.</p>
                    </div>
                </CardContent>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
