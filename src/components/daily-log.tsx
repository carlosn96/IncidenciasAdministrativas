
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Incident, DaySchedule } from "@/lib/types";
import { Play, Square, MapPin, Pencil, Trash2, ArrowRight, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isWithinInterval, parse, differenceInMinutes, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function DailyLog() {
  const { periods, updatePeriods, userLocations, schedules, activeScheduleId } = useSettings();
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [manualLocation, setManualLocation] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<({ type: 'Entrada' | 'Salida' } & Incident) | null>(null);
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newManualLocation, setNewManualLocation] = useState("");
  const [newComment, setNewComment] = useState("");
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const activeSchedule = useMemo(() => {
    return schedules.find(s => s.id === activeScheduleId);
  }, [schedules, activeScheduleId]);

  const { activePeriod, todayLaborDay } = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const activePeriod = periods.find(p => isWithinInterval(today, { start: p.startDate, end: endOfDay(p.endDate) }));
    const todayLaborDay = activePeriod?.laborDays.find(ld => ld.date === todayStr);
    
    return { activePeriod, todayLaborDay };
  }, [periods]);

  const workedHoursToday = useMemo(() => {
    if (!todayLaborDay) return "N/A";
    return calculateWorkedHours(todayLaborDay.entry, todayLaborDay.exit);
  }, [todayLaborDay]);

  const hasEntrada = !!todayLaborDay?.entry;
  const hasSalida = !!todayLaborDay?.exit;

  useEffect(() => {
    const today = new Date();
    setCurrentDay(format(today, "EEEE, d 'de' LLLL 'de' yyyy", { locale: es }));

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (hasEntrada && hasSalida) return; // Don't change location if day is complete
    if (!activeSchedule) return;

    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayIndex = new Date().getDay();
    const todaySpanish = daysOfWeek[dayIndex] as DaySchedule['day'];

    const todaySchedule = activeSchedule.entries.find(s => s.day === todaySpanish);
    
    const nextEventType = hasEntrada ? 'Salida' : 'Entrada';

    if (todaySchedule) {
      if (nextEventType === 'Entrada') {
        setSelectedLocation(todaySchedule.startLocation || "");
      } else { // nextEventType is 'Salida'
        setSelectedLocation(todaySchedule.endLocation || "");
      }
    } else if (userLocations.length > 0) {
      setSelectedLocation(userLocations[0].name);
    } else {
      setSelectedLocation("");
    }
  }, [hasEntrada, hasSalida, activeSchedule, userLocations]);

  const handleRegisterEvent = (type: 'Entrada' | 'Salida') => {
    const locationToRegister = selectedLocation === 'manual' ? manualLocation.trim() : selectedLocation;

    if (!locationToRegister) {
      toast({
        variant: "destructive",
        title: "Ubicación Requerida",
        description: "Por favor, selecciona o especifica una ubicación antes de registrar.",
      });
      return;
    }

     if (!activePeriod || !todayLaborDay) {
      toast({
        variant: "destructive",
        title: "Periodo no encontrado",
        description: "No hay un periodo activo o día laboral configurado para hoy.",
      });
      return;
    }

    const now = new Date();
    const newIncident: Incident = {
      time: format(now, "HH:mm"),
      location: locationToRegister,
      comment: comment.trim() || null,
    };
    
    const keyToUpdate = type === 'Entrada' ? 'entry' : 'exit';

    const updatedPeriods = periods.map(p => {
      if (p.id === activePeriod.id) {
        const updatedLaborDays = p.laborDays.map(ld => {
          if (ld.date === todayLaborDay.date) {
            return { ...ld, [keyToUpdate]: newIncident };
          }
          return ld;
        });
        return { ...p, laborDays: updatedLaborDays };
      }
      return p;
    });

    updatePeriods(updatedPeriods);

    toast({
      title: `${type} Registrada`,
      description: `Has registrado tu ${type.toLowerCase()} en ${locationToRegister} a las ${format(now, 'p', { locale: es })}.`,
    });

    // Clear comment after registration
    setComment("");
  };

  const handleOpenEditDialog = (incident: { type: 'Entrada' | 'Salida' } & Incident) => {
    setEditingIncident(incident);
    setNewTime(incident.time);
    setNewComment(incident.comment || "");
    
    const isManual = !userLocations.some(loc => loc.name === incident.location);
    if (isManual) {
        setNewLocation('manual');
        setNewManualLocation(incident.location);
    } else {
        setNewLocation(incident.location);
        setNewManualLocation('');
    }
    
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    setSaveState('saving');
    const locationToSave = newLocation === 'manual' ? newManualLocation.trim() : newLocation;

    if (!editingIncident || !activePeriod || !todayLaborDay || !locationToSave) {
        toast({
            variant: "destructive",
            title: "Datos incompletos",
            description: "Por favor, completa la hora y la ubicación.",
        });
        setSaveState('idle');
        return;
    }
  
    // Validation
    if (editingIncident.type === 'Salida' && todayLaborDay.entry?.time) {
      if (newTime < todayLaborDay.entry.time) {
        toast({
          variant: "destructive",
          title: "Hora de salida inválida",
          description: "La hora de salida no puede ser anterior a la hora de entrada.",
        });
        setSaveState('idle');
        return;
      }
    }
    if (editingIncident.type === 'Entrada' && todayLaborDay.exit?.time) {
      if (newTime > todayLaborDay.exit.time) {
        toast({
          variant: "destructive",
          title: "Hora de entrada inválida",
          description: "La hora de entrada no puede ser posterior a la hora de salida.",
        });
        setSaveState('idle');
        return;
      }
    }
  
    const keyToUpdate = editingIncident.type === 'Entrada' ? 'entry' : 'exit';
    
    const updatedPeriods = periods.map(p => {
      if (p.id === activePeriod.id) {
        const updatedLaborDays = p.laborDays.map(ld => {
          if (ld.date === todayLaborDay.date) {
            const updatedDay = { ...ld };
            if (updatedDay[keyToUpdate]) {
              updatedDay[keyToUpdate] = { ...updatedDay[keyToUpdate]!, time: newTime, location: locationToSave, comment: newComment.trim() || undefined };
            }
            return updatedDay;
          }
          return ld;
        });
        return { ...p, laborDays: updatedLaborDays };
      }
      return p;
    });
  
    updatePeriods(updatedPeriods);
    setSaveState('saved');
    setTimeout(() => {
        setIsEditDialogOpen(false);
        setEditingIncident(null);
        setSaveState('idle');
    }, 1500);
  };

  const handleDeleteEvent = (type: 'Entrada' | 'Salida') => {
    if (!activePeriod || !todayLaborDay) return;
  
    const updatedPeriods = periods.map(p => {
      if (p.id === activePeriod.id) {
        const updatedLaborDays = p.laborDays.map(ld => {
          if (ld.date === todayLaborDay.date) {
            const updatedDay = { ...ld };
            if (type === 'Entrada') {
              delete updatedDay.entry;
              delete updatedDay.exit; // If entry is deleted, exit must be deleted too
            } else { // type === 'Salida'
              delete updatedDay.exit;
            }
            return updatedDay;
          }
          return ld;
        });
        return { ...p, laborDays: updatedLaborDays };
      }
      return p;
    });
  
    updatePeriods(updatedPeriods);
    toast({
      title: "Registro Eliminado",
      description: `Se ha eliminado el registro de ${type.toLowerCase()}.`,
    });
  };

  const eventsForTable: ({id: string, type: 'Entrada' | 'Salida'} & Incident)[] = [];
  if (todayLaborDay?.entry) {
    eventsForTable.push({ id: 'entrada-today', type: 'Entrada', ...todayLaborDay.entry });
  }
  if (todayLaborDay?.exit) {
    eventsForTable.push({ id: 'salida-today', type: 'Salida', ...todayLaborDay.exit });
  }

  const formatTime12h = (timeStr?: string): string => {
    if (!timeStr) return "---";
    try {
      const time = parse(timeStr, "HH:mm", new Date());
      return format(time, "p", { locale: es });
    } catch (error) {
      return "---";
    }
  };


  return (
    <>
        <Card>
        <CardHeader>
            <CardTitle>Registro Diario</CardTitle>
            <CardDescription>Registra tus eventos de entrada y salida del día.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="md:col-span-1">
                <Card className="flex flex-col justify-center items-center text-center p-4 md:p-6 h-full bg-muted/30">
                  {currentTime && currentDay ? (
                    <>
                      <p className="text-4xl md:text-5xl font-bold font-mono tracking-tighter text-primary">{currentTime}</p>
                      <p className="text-base text-muted-foreground mt-2 capitalize">{currentDay}</p>
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-[3rem] w-[11rem] mb-2" />
                      <Skeleton className="h-5 w-48" />
                    </>
                  )}
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="p-4 md:p-6 h-full flex flex-col justify-center">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="location-select" className="mb-2 block">Ubicación de registro</Label>
                            {userLocations.length > 0 ? (
                                <>
                                    <Select 
                                        value={selectedLocation} 
                                        onValueChange={(value) => {
                                            setSelectedLocation(value);
                                            if (value !== 'manual') {
                                                setManualLocation(""); // Clear manual input if another option is selected
                                            }
                                        }} 
                                        disabled={hasEntrada && hasSalida}
                                    >
                                        <SelectTrigger id="location-select">
                                            <SelectValue placeholder="Selecciona una ubicación..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {userLocations.map(loc => (
                                                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                            ))}
                                            <SelectItem value="manual">Otro (especificar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {selectedLocation === 'manual' && (
                                        <Input 
                                            className="mt-2"
                                            placeholder="Escribe la ubicación manual"
                                            value={manualLocation}
                                            onChange={(e) => setManualLocation(e.target.value)}
                                            disabled={hasEntrada && hasSalida}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-4 rounded-md border border-dashed bg-muted/50">
                                    <p className="text-sm text-muted-foreground">Primero debes añadir una ubicación de trabajo.</p>
                                    <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0">
                                        <Link href="/dashboard/settings?tab=locations">
                                            Ir a configuración
                                            <ArrowRight className="ml-1 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="comment" className="mb-2 block">Comentario (opcional)</Label>
                            <Textarea
                                id="comment"
                                placeholder="Agrega un comentario sobre este registro..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                disabled={hasEntrada && hasSalida}
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <Button
                                size="lg"
                                onClick={() => handleRegisterEvent('Entrada')}
                                disabled={!activePeriod || !todayLaborDay || (!selectedLocation || (selectedLocation === 'manual' && !manualLocation)) || hasEntrada}
                                className="h-12 text-base"
                            >
                                <Play className="mr-2 h-5 w-5" />
                                Registrar Entrada
                            </Button>
                            <Button
                                size="lg"
                                variant="destructive"
                                onClick={() => handleRegisterEvent('Salida')}
                                disabled={!activePeriod || !todayLaborDay || (!selectedLocation || (selectedLocation === 'manual' && !manualLocation)) || !hasEntrada || hasSalida}
                                className="h-12 text-base"
                            >
                                <Square className="mr-2 h-5 w-5" />
                                Registrar Salida
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
            </div>
            
            <div>
            <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-lg font-medium">Eventos de Hoy</h3>
                {workedHoursToday !== "N/A" && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Hoy: </span>
                    <span className="font-bold font-mono text-base">{workedHoursToday}</span>
                  </div>
                )}
              </div>
            <Card>
                <CardContent className="p-0">
                  {/* Mobile View */}
                  <div className="md:hidden border-t">
                      {eventsForTable.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                              No hay eventos registrados hoy.
                          </div>
                      ) : (
                          [...eventsForTable].reverse().map((event, index) => (
                              <div key={event.id} className={cn("p-4 flex justify-between items-start", index < eventsForTable.length - 1 && "border-b")}>
                                  <div>
                                      <Badge variant={event.type === 'Entrada' ? 'default' : 'secondary'}>
                                          {event.type}
                                      </Badge>
                                      <p className="font-semibold text-lg mt-1">{formatTime12h(event.time)}</p>
                                      <p className="text-muted-foreground">{event.location}</p>
                                      {event.comment && <p className="text-sm text-muted-foreground mt-1 italic">{event.comment}</p>}
                                  </div>
                                  <div className="flex items-center -mr-3">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(event)}>
                                          <Pencil className="h-4 w-4" />
                                          <span className="sr-only">Editar</span>
                                      </Button>
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                              <Trash2 className="h-4 w-4" />
                                              <span className="sr-only">Eliminar</span>
                                          </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                              {event.type === 'Entrada'
                                                  ? "Esta acción no se puede deshacer. Esto eliminará permanentemente los registros de entrada y salida de hoy."
                                                  : "Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de salida."
                                              }
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteEvent(event.type)}>Continuar</AlertDialogAction>
                                          </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Comentario</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {eventsForTable.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No hay eventos registrados hoy.
                                </TableCell>
                            </TableRow>
                        ) : (
                            [...eventsForTable].reverse().map((event) => (
                                <TableRow key={event.id}>
                                <TableCell>
                                    <Badge variant={event.type === 'Entrada' ? 'default' : 'secondary'}>
                                    {event.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatTime12h(event.time)}</TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell>{event.comment || "---"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(event)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                {event.type === 'Entrada'
                                                    ? "Esta acción no se puede deshacer. Esto eliminará permanentemente los registros de entrada y salida de hoy."
                                                    : "Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de salida."
                                                }
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteEvent(event.type)}>Continuar</AlertDialogAction>
                                            </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                  </div>
                </CardContent>
            </Card>
            </div>
        </CardContent>
        </Card>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
                <DialogTitle>Editar Registro de {editingIncident?.type}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1">
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-time">Hora</Label>
                        <Input 
                            id="edit-time" 
                            type="time" 
                            value={newTime} 
                            onChange={e => setNewTime(e.target.value)}
                            className="text-base"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-location">Ubicación</Label>
                        <Select value={newLocation} onValueChange={setNewLocation}>
                            <SelectTrigger id="edit-location">
                                <SelectValue placeholder="Selecciona una ubicación..." />
                            </SelectTrigger>
                            <SelectContent>
                                {userLocations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                ))}
                                <SelectItem value="manual">Otro (especificar)</SelectItem>
                            </SelectContent>
                        </Select>
                        {newLocation === 'manual' && (
                            <Input
                                id="edit-manual-location"
                                placeholder="Escribe la ubicación"
                                value={newManualLocation}
                                onChange={(e) => setNewManualLocation(e.target.value)}
                                className="mt-2"
                            />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-comment">Comentario (opcional)</Label>
                        <Textarea
                            id="edit-comment"
                            placeholder="Agrega un comentario..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saveState !== 'idle'}>Cancelar</Button>
                <Button onClick={handleSaveChanges} disabled={saveState !== 'idle'} className="w-[150px]">
                     {saveState === 'saving' ? (<><Loader2 className="animate-spin" /> Guardando...</>)
                     : saveState === 'saved' ? (<><Check /> Guardado</>)
                     : 'Guardar Cambios'}
                </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    </>
  );
}
