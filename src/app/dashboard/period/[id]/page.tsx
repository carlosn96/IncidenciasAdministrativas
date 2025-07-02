
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, Pencil, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { differenceInMinutes, format, parse, parseISO, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { LaborDay, Incident, ScheduleEntry } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import { EditPeriodDialog } from "@/components/edit-period-dialog";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";


// Helper function to calculate worked hours
const calculateWorkedHours = (entry?: Incident, exit?: Incident): string => {
  if (!entry?.time || !exit?.time) return "N/A";

  const [startHour, startMinute] = entry.time.split(":").map(Number);
  const [endHour, endMinute] = exit.time.split(":").map(Number);

  const startDate = new Date(0);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(0);
  endDate.setHours(endHour, endMinute, 0, 0);

  const diffMinutes = differenceInMinutes(endDate, startDate);
  if (diffMinutes < 0) return "N/A";

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}h ${minutes}m`;
};

const calculateTotalMinutes = (days: LaborDay[]): number => {
  return days.reduce((total, day) => {
    if (!day.entry?.time || !day.exit?.time) return total;

    const [startHour, startMinute] = day.entry.time.split(":").map(Number);
    const [endHour, endMinute] = day.exit.time.split(":").map(Number);

    const startDate = new Date(0);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(0);
    endDate.setHours(endHour, endMinute, 0, 0);

    const diffMinutes = differenceInMinutes(endDate, startDate);
    return total + (diffMinutes > 0 ? diffMinutes : 0);
  }, 0);
};

const formatTotalHours = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} horas ${minutes} minutos`;
};

const formatTime12h = (timeStr?: string): string => {
  if (!timeStr) return "---";
  try {
    const time = parse(timeStr, "HH:mm", new Date());
    return format(time, "p", { locale: es });
  } catch (error) {
    return "---";
  }
};


export default function PeriodDetailPage() {
  const params = useParams<{ id: string }>();
  const { periods, setPeriods, userLocations, schedule } = useSettings();
  const period = periods.find(p => p.id === params.id);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // State for editing a single day
  const [isEditDayDialogOpen, setIsEditDayDialogOpen] = useState(false);
  const [dayToEdit, setDayToEdit] = useState<LaborDay | null>(null);
  
  // Form state for the day editing dialog
  const [entryTime, setEntryTime] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [exitLocation, setExitLocation] = useState("");

  useEffect(() => {
    if (dayToEdit) {
      // If the day already has an entry, use that data.
      if (dayToEdit.entry) {
        setEntryTime(dayToEdit.entry?.time || "");
        setEntryLocation(dayToEdit.entry?.location || "");
        setExitTime(dayToEdit.exit?.time || "");
        setExitLocation(dayToEdit.exit?.location || "");
      } else {
        // If the day is empty, load from default schedule.
        const dayDate = parseISO(dayToEdit.date);
        const dayOfWeekIndex = getDay(dayDate); // 0=Sun, 1=Mon, ..., 6=Sat

        const daysOfWeekSpanish = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const dayName = daysOfWeekSpanish[dayOfWeekIndex] as ScheduleEntry['day'];
        
        const defaultDaySchedule = schedule.find(s => s.day === dayName);

        if (defaultDaySchedule) {
          setEntryTime(defaultDaySchedule.startTime || "");
          setEntryLocation(defaultDaySchedule.startLocation || "");
          setExitTime(defaultDaySchedule.endTime || "");
          setExitLocation(defaultDaySchedule.endLocation || "");
        } else {
          // Fallback if no schedule is found (e.g., for Sunday, which is filtered out)
          setEntryTime("");
          setEntryLocation("");
          setExitTime("");
          setExitLocation("");
        }
      }
    }
  }, [dayToEdit, schedule]);


  const handleOpenEditDayDialog = (day: LaborDay) => {
    setDayToEdit(day);
    setIsEditDayDialogOpen(true);
  };

  const handleSaveDayChanges = () => {
    if (!period || !dayToEdit) return;

    if (entryTime && exitTime && exitTime < entryTime) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La hora de salida no puede ser anterior a la hora de entrada.",
      });
      return;
    }

    const updatedLaborDays = period.laborDays.map(day => {
      if (day.date === dayToEdit.date) {
        const newDay = { ...day };

        if (entryTime && entryLocation) {
          newDay.entry = { time: entryTime, location: entryLocation };
        } else {
          delete newDay.entry;
        }

        if (exitTime && exitLocation && newDay.entry) {
          newDay.exit = { time: exitTime, location: exitLocation };
        } else {
          delete newDay.exit;
        }

        return newDay;
      }
      return day;
    });
    
    const updatedPeriod = { ...period, laborDays: updatedLaborDays };

    setPeriods(prevPeriods =>
      prevPeriods.map(p => (p.id === period.id ? updatedPeriod : p))
    );

    toast({
      title: "Día Actualizado",
      description: "Los cambios en el día se han guardado correctamente.",
    });
    setIsEditDayDialogOpen(false);
    setDayToEdit(null);
  };

  const handleDownloadCSV = () => {
    if (!period) return;

    // Sanitize period name for filename
    const fileName = `Reporte_${period.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

    const headers = [
      "Fecha",
      "Día de la Semana",
      "Lugar Entrada",
      "Hora Entrada (24h)",
      "Hora Entrada (12h)",
      "Lugar Salida",
      "Hora Salida (24h)",
      "Hora Salida (12h)",
      "Horas Laboradas",
    ];

    const rows = period.laborDays.map(day => {
        const date = parseISO(day.date);
        const dayOfWeek = format(date, "EEEE", { locale: es });
        const formattedDate = format(date, "yyyy-MM-dd");

        const entryTime24 = day.entry?.time || '---';
        const entryTime12 = formatTime12h(day.entry?.time);
        const entryLocation = day.entry?.location || '---';

        const exitTime24 = day.exit?.time || '---';
        const exitTime12 = formatTime12h(day.exit?.time);
        const exitLocation = day.exit?.location || '---';
        
        const workedHours = calculateWorkedHours(day.entry, day.exit);

        const rowData = [
            formattedDate,
            dayOfWeek,
            entryLocation,
            entryTime24,
            entryTime12,
            exitLocation,
            exitTime24,
            exitTime12,
            workedHours
        ];

        return rowData.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Reporte Descargado",
      description: `El archivo ${fileName} se ha descargado correctamente.`,
    });
  };

  if (!period) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Periodo no encontrado</h1>
        <p className="text-muted-foreground mt-2">
          El periodo que buscas no existe. Por favor, vuelve a intentarlo.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Ajustes de Periodos
          </Link>
        </Button>
      </div>
    )
  }

  const laborDays = period.laborDays;
  const totalMinutesWorked = calculateTotalMinutes(laborDays);
  const formattedTotalHours = formatTotalHours(totalMinutesWorked);
  
  const totalMinutesExpected = period.totalDurationMinutes || 0;
  const remainingMinutes = Math.max(0, totalMinutesExpected - totalMinutesWorked);
  const formattedRemainingHours = formatTotalHours(remainingMinutes);
  const formattedExpectedHours = formatTotalHours(totalMinutesExpected);
  const progressPercentage = totalMinutesExpected > 0 ? Math.min(100, (totalMinutesWorked / totalMinutesExpected) * 100) : 0;

  const formattedDateRange = `${format(period.startDate, "d 'de' LLLL", { locale: es })} al ${format(period.endDate, "d 'de' LLLL, yyyy", { locale: es })}`;

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/dashboard/settings">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver a Ajustes</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">Detalle del Periodo</h1>
                <p className="text-muted-foreground">
                    Visualiza las incidencias registradas y el total de horas laboradas.
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Editar Periodo</span>
              <span className="sm:hidden">Editar</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Descargar</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{period.name}</CardTitle>
            <CardDescription>
              {formattedDateRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 rounded-lg bg-muted/50 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center">
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Horas Laboradas</p>
                            <p className="text-2xl font-bold">{formattedTotalHours}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Horas Restantes</p>
                        <p className="text-lg font-semibold">{formattedRemainingHours}</p>
                    </div>
                </div>
                <div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>Meta: {formattedExpectedHours}</span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de Incidencias</CardTitle>
            <CardDescription>
              Detalle de entradas y salidas para cada día del periodo seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile View */}
            <div className="md:hidden">
              {laborDays.length > 0 ? (
                  <div className="border rounded-lg">
                      {laborDays.map((day, index) => (
                          <div key={day.date} className={cn("p-4", index < laborDays.length - 1 && "border-b")}>
                              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between mb-2">
                                  <p className="font-medium capitalize">
                                      {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                                  </p>
                                  <p className="font-mono font-semibold text-right w-full sm:w-auto">
                                      {calculateWorkedHours(day.entry, day.exit)}
                                  </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                  <div>
                                      <p className="font-semibold text-muted-foreground">Entrada</p>
                                      <p>{formatTime12h(day.entry?.time)}</p>
                                      <p className="text-muted-foreground">{day.entry?.location || '---'}</p>
                                  </div>
                                  <div>
                                      <p className="font-semibold text-muted-foreground">Salida</p>
                                      <p>{formatTime12h(day.exit?.time)}</p>
                                      <p className="text-muted-foreground">{day.exit?.location || '---'}</p>
                                  </div>
                              </div>
                               <div className="mt-4 flex justify-end">
                                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDayDialog(day)}>
                                      <Pencil className="mr-2 h-4 w-4"/>
                                      Editar Día
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center text-muted-foreground py-16 border rounded-lg">
                      <p>No hay días laborables configurados para este periodo.</p>
                  </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Lugar Entrada</TableHead>
                          <TableHead>Hora Entrada</TableHead>
                          <TableHead>Lugar Salida</TableHead>
                          <TableHead>Hora Salida</TableHead>
                          <TableHead className="text-right">Horas Laboradas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {laborDays.length > 0 ? (
                          laborDays.map((day) => (
                              <TableRow key={day.date}>
                                  <TableCell className="font-medium capitalize whitespace-nowrap">
                                      {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                                  </TableCell>
                                  <TableCell>{day.entry?.location || '---'}</TableCell>
                                  <TableCell>{formatTime12h(day.entry?.time)}</TableCell>
                                  <TableCell>{day.exit?.location || '---'}</TableCell>
                                  <TableCell>{formatTime12h(day.exit?.time)}</TableCell>
                                  <TableCell className="text-right font-mono">
                                      {calculateWorkedHours(day.entry, day.exit)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDayDialog(day)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar Día</span>
                                    </Button>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                                  <p>No hay días laborables configurados para este periodo.</p>
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDayDialogOpen} onOpenChange={setIsEditDayDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Día</DialogTitle>
            {dayToEdit && 
              <DialogDescription>
                  Editando registros para el {format(parseISO(dayToEdit.date), "EEEE, d 'de' LLLL", { locale: es })}.
              </DialogDescription>
            }
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4 p-4 rounded-md border bg-muted/30">
              <h4 className="font-medium">Entrada</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryTime">Hora</Label>
                  <Input id="entryTime" type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryLocation">Lugar</Label>
                  <Select value={entryLocation} onValueChange={setEntryLocation}>
                    <SelectTrigger id="entryLocation">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userLocations.map(loc => <SelectItem key={`${loc.id}-entry`} value={loc.name}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4 rounded-md border bg-muted/30">
              <h4 className="font-medium">Salida</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exitTime">Hora</Label>
                  <Input id="exitTime" type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} disabled={!entryTime || !entryLocation} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitLocation">Lugar</Label>
                  <Select value={exitLocation} onValueChange={setExitLocation} disabled={!entryTime || !entryLocation}>
                    <SelectTrigger id="exitLocation">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userLocations.map(loc => <SelectItem key={`${loc.id}-exit`} value={loc.name}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDayChanges}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditPeriodDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} period={period} />
    </>
  );
}
