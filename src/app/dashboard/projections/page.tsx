
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSettings } from "@/context/settings-context";
import type { Period, LaborDay, Incident, Schedule, DaySchedule } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO, differenceInMinutes, getDay, isBefore, startOfDay, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Save, PlusCircle, BrainCircuit, AlertTriangle, UploadCloud, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { v4 as uuidv4 } from "uuid";

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
  const { periods, setPeriods, userLocations, schedules, activeScheduleId, setSchedules, setActiveScheduleId } = useSettings();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [projections, setProjections] = useState<LaborDay[]>([]);
  const { toast } = useToast();
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.id === activeScheduleId);
  }, [schedules, activeScheduleId]);

  useEffect(() => {
    const periodIdFromUrl = searchParams.get("period");
    if (periodIdFromUrl && periods.some(p => p.id === periodIdFromUrl)) {
      setSelectedPeriodId(periodIdFromUrl);
    } else if (periods.length > 0) {
      // Default to the first period if none is specified or found
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
          description: 'No tienes una plantilla de horario activa para cargar. Ve a Ajustes > Horarios para seleccionar una.'
        });
      }
      return;
    }

    const newProjections = projections.map(day => {
        const newDay = JSON.parse(JSON.stringify(day)); 
        
        // Skip days that are in the past or have real entries
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
        
        // Always apply schedule to future days
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

  // This effect initializes projections when a period is selected.
  useEffect(() => {
    if (selectedPeriod) {
      const initialProjections = selectedPeriod.laborDays.map(day => {
        const newDay = JSON.parse(JSON.stringify(day));
        
        // Pre-fill with active schedule only if no projection exists
        if (activeSchedule && !newDay.projectedEntry && !newDay.projectedExit) {
            const dayDate = parseISO(day.date);
            const dayOfWeekIndex = getDay(dayDate);
            const dayName = daysOfWeekSpanish[dayOfWeekIndex] as DaySchedule['day'];
            const scheduleForDay = activeSchedule.entries.find(e => e.day === dayName);

            if (scheduleForDay) {
                if (scheduleForDay.startTime && scheduleForDay.startLocation) {
                  newDay.projectedEntry = { time: scheduleForDay.startTime, location: scheduleForDay.startLocation };
                }
                if (scheduleForDay.endTime && scheduleForDay.endLocation) {
                  newDay.projectedExit = { time: scheduleForDay.endTime, location: scheduleForDay.endLocation };
                }
            }
        }
        return newDay;
      });
      setProjections(initialProjections);
    } else {
      setProjections([]);
    }
  }, [selectedPeriod, activeSchedule]);

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
          return updatedDay;
        }
        return day;
      })
    );
  };

  const handleSaveChanges = () => {
    if (!selectedPeriodId) return;
    setSaveState('saving');

    for (const day of projections) {
        if ((day.projectedEntry?.time && !day.projectedEntry?.location) || (!day.projectedEntry?.time && day.projectedEntry?.location)) {
            toast({ variant: 'destructive', title: 'Datos Incompletos', description: `La entrada proyectada para el ${format(parseISO(day.date), "d MMM", { locale: es })} está incompleta.` });
            setSaveState('idle');
            return;
        }
        if ((day.projectedExit?.time && !day.projectedExit?.location) || (!day.projectedExit?.time && day.projectedExit?.location)) {
            toast({ variant: 'destructive', title: 'Datos Incompletos', description: `La salida proyectada para el ${format(parseISO(day.date), "d MMM", { locale: es })} está incompleta.` });
            setSaveState('idle');
            return;
        }
        if (day.projectedEntry?.time && day.projectedExit?.time && day.projectedExit.time < day.projectedEntry.time) {
            toast({ variant: 'destructive', title: 'Error de Horas', description: `La hora de salida no puede ser anterior a la de entrada para el ${format(parseISO(day.date), "d MMM", { locale: es })}.` });
            setSaveState('idle');
            return;
        }
    }

    setPeriods(prevPeriods =>
      prevPeriods.map(p => {
        if (p.id === selectedPeriodId) {
           const cleanedProjections = projections.map(day => {
            const cleanedDay = {...day};
            if (cleanedDay.projectedEntry && (!cleanedDay.projectedEntry.time || !cleanedDay.projectedEntry.location)) {
              delete cleanedDay.projectedEntry;
            }
            if (cleanedDay.projectedExit && (!cleanedDay.projectedExit.time || !cleanedDay.projectedExit.location)) {
              delete cleanedDay.projectedExit;
            }
            return cleanedDay;
          });
          return { ...p, laborDays: cleanedProjections };
        }
        return p;
      })
    );

    setSaveState('saved');
    setTimeout(() => {
        setSaveState('idle');
    }, 2000);
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

    setSchedules(prev => [...prev, newSchedule]);
    setActiveScheduleId(newSchedule.id);
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
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                      {projections.map((day) => {
                         const isPastDay = isBefore(parseISO(day.date), startOfDay(new Date()));
                         const deviationMessage = checkDeviation(day);
                         return (
                           <div key={day.date} className={cn("border rounded-lg p-4", day.entry && day.exit && "bg-green-500/10 border-green-500/20")}>
                              <div className="flex justify-between items-start mb-4">
                                <p className="font-medium capitalize">
                                  {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                                  {deviationMessage && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button className="ml-2 align-middle"><AlertTriangle className="h-4 w-4 text-amber-500" /></button>
                                      </TooltipTrigger>
                                      <TooltipContent><p>{deviationMessage}</p></TooltipContent>
                                    </Tooltip>
                                  )}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Entrada Proyectada</Label>
                                  <Input type="time" value={day.projectedEntry?.time || ""} onChange={(e) => handleProjectionChange(day.date, "projectedEntry", "time", e.target.value)} disabled={!!day.entry || isPastDay} />
                                  <Select value={day.projectedEntry?.location || ""} onValueChange={(value) => handleProjectionChange(day.date, "projectedEntry", "location", value)} disabled={!!day.entry || isPastDay}>
                                    <SelectTrigger><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                    <SelectContent>{userLocations.map(loc => (<SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Salida Proyectada</Label>
                                  <Input type="time" value={day.projectedExit?.time || ""} onChange={(e) => handleProjectionChange(day.date, "projectedExit", "time", e.target.value)} disabled={!!day.exit || isPastDay} />
                                  <Select value={day.projectedExit?.location || ""} onValueChange={(value) => handleProjectionChange(day.date, "projectedExit", "location", value)} disabled={!!day.exit || isPastDay}>
                                    <SelectTrigger><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                    <SelectContent>{userLocations.map(loc => (<SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                  </Select>
                                </div>
                              </div>
                               
                              <div className="flex justify-between mt-4 text-sm pt-4 border-t">
                                <div>
                                    <span className="text-muted-foreground">Proyectadas: </span>
                                    <span className="font-mono font-semibold">{formatMinutesToHours(calculateMinutes(day.projectedEntry || day.entry, day.projectedExit || day.exit))}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Reales: </span>
                                    <span className="font-mono font-semibold text-green-600">{formatMinutesToHours(calculateMinutes(day.entry, day.exit))}</span>
                                </div>
                              </div>
                           </div>
                         )
                      })}
                    </div>

                    {/* Desktop View */}
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
                            const isPastDay = isBefore(parseISO(day.date), startOfDay(new Date()));
                            const deviationMessage = checkDeviation(day);
                            return (
                                <TableRow key={day.date} className={cn(day.entry && day.exit && "bg-green-500/10")}>
                                    <TableCell className="font-medium capitalize whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {format(parseISO(day.date), "EEEE, d", { locale: es })}
                                        {deviationMessage && (
                                          <Tooltip>
                                            <TooltipTrigger asChild><button><AlertTriangle className="h-4 w-4 text-amber-500" /></button></TooltipTrigger>
                                            <TooltipContent><p>{deviationMessage}</p></TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell><Input type="time" className="min-w-[100px]" value={day.projectedEntry?.time || ""} onChange={e => handleProjectionChange(day.date, 'projectedEntry', 'time', e.target.value)} disabled={!!day.entry || isPastDay} /></TableCell>
                                    <TableCell>
                                      <Select value={day.projectedEntry?.location || ""} onValueChange={v => handleProjectionChange(day.date, 'projectedEntry', 'location', v)} disabled={!!day.entry || isPastDay}>
                                        <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                        <SelectContent>{userLocations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell><Input type="time" className="min-w-[100px]" value={day.projectedExit?.time || ""} onChange={e => handleProjectionChange(day.date, 'projectedExit', 'time', e.target.value)} disabled={!!day.exit || isPastDay} /></TableCell>
                                    <TableCell>
                                       <Select value={day.projectedExit?.location || ""} onValueChange={v => handleProjectionChange(day.date, 'projectedExit', 'location', v)} disabled={!!day.exit || isPastDay}>
                                        <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                        <SelectContent>{userLocations.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
                                      </Select>
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

                <div className="flex justify-end pt-6">
                    <Button onClick={handleSaveChanges} disabled={!selectedPeriod || saveState !== 'idle'} className="w-[200px]">
                        {saveState === 'saving' ? (<><Loader2 className="animate-spin" /> Guardando...</>)
                        : saveState === 'saved' ? (<><Check /> Guardado</>)
                        : (<><Save /> Guardar Proyección</>)}
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
