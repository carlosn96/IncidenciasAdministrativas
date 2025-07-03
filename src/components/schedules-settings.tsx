
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleEntry, Location } from "@/lib/types";
import { Pencil, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchedulesSettingsProps {
    userLocations: Location[];
    schedule: ScheduleEntry[];
    setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
}

export function SchedulesSettings({ userLocations, schedule, setSchedule }: SchedulesSettingsProps) {
    const { toast } = useToast();
    
    // State for individual day editing
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<ScheduleEntry | null>(null);
    const [dayData, setDayData] = useState<ScheduleEntry | null>(null);

    // State for general schedule creation
    const [isGeneralDialogOpen, setIsGeneralDialogOpen] = useState(false);
    const [generalStartTime, setGeneralStartTime] = useState("");
    const [generalEndTime, setGeneralEndTime] = useState("");
    const [generalStartLocation, setGeneralStartLocation] = useState("");
    const [generalEndLocation, setGeneralEndLocation] = useState("");
    const [applyToSaturday, setApplyToSaturday] = useState(false);


    useEffect(() => {
        if (!isGeneralDialogOpen) {
            setGeneralStartTime("");
            setGeneralEndTime("");
            setGeneralStartLocation("");
            setGeneralEndLocation("");
            setApplyToSaturday(false);
        }
    }, [isGeneralDialogOpen]);

    const handleOpenEditDialog = (day: ScheduleEntry) => {
      setEditingDay(day);
      setDayData(day);
      setIsEditDialogOpen(true);
    };

    const handleFieldChange = (field: keyof Omit<ScheduleEntry, 'day'>, value: string) => {
      if (dayData) {
          setDayData({ ...dayData, [field]: value });
      }
    };

    const handleSaveChanges = () => {
      if (dayData) {
          if (dayData.startTime && dayData.endTime && dayData.startTime > dayData.endTime) {
            toast({
              variant: "destructive",
              title: "Error de validación",
              description: "La hora de salida no puede ser anterior a la hora de entrada.",
            });
            return;
          }
          setSchedule(prevSchedule =>
              prevSchedule.map(day => (day.day === dayData.day ? dayData : day))
          );
          toast({
              title: "Horario Actualizado",
              description: `El horario para ${dayData.day} ha sido guardado.`,
          });
          setIsEditDialogOpen(false);
          setEditingDay(null);
      }
    };
    
    const handleApplyGeneralSchedule = () => {
        if (!generalStartTime || !generalEndTime || !generalStartLocation || !generalEndLocation) {
            toast({
                variant: "destructive",
                title: "Campos incompletos",
                description: "Por favor, completa todos los campos del horario general para continuar.",
            });
            return;
        }

        if (generalStartTime > generalEndTime) {
            toast({
                variant: "destructive",
                title: "Error de validación",
                description: "La hora de salida no puede ser anterior a la hora de entrada.",
            });
            return;
        }

        const updatedSchedule = schedule.map(day => {
            const isSaturday = day.day === 'Sábado';
            if (!isSaturday || (isSaturday && applyToSaturday)) {
                return {
                    ...day,
                    startTime: generalStartTime,
                    endTime: generalEndTime,
                    startLocation: generalStartLocation,
                    endLocation: generalEndLocation,
                };
            }
            return day;
        });

        setSchedule(updatedSchedule);
        toast({
            title: "Horario General Aplicado",
            description: "El horario semanal ha sido actualizado correctamente.",
        });
        setIsGeneralDialogOpen(false);
    };

    const formatTime12h = (timeStr: string) => {
        if (!timeStr) return "---";
        const [hours, minutes] = timeStr.split(":");
        if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return "---";
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        return `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <CardTitle>Horario Semanal por Defecto</CardTitle>
                    <CardDescription>
                    Este es su horario de trabajo semanal predeterminado. Puede ser anulado por incidencias específicas.
                    </CardDescription>
                </div>
                <Button onClick={() => setIsGeneralDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Horario General
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {/* Mobile View */}
            <div className="md:hidden">
              {schedule.length > 0 ? (
                  <div className="border rounded-lg">
                      {schedule.map((entry, index) => (
                          <div key={entry.day} className={cn("p-4", index < schedule.length - 1 && "border-b")}>
                              <div className="flex justify-between items-center mb-4">
                                  <p className="font-medium text-lg">{entry.day}</p>
                                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(entry)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                  </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-1">
                                      <p className="text-muted-foreground">Entrada</p>
                                      <p className="font-semibold">{entry.startTime ? formatTime12h(entry.startTime) : "---"}</p>
                                      <p className="text-muted-foreground truncate">{entry.startLocation || "Día Libre"}</p>
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-muted-foreground">Salida</p>
                                      <p className="font-semibold">{entry.endTime ? formatTime12h(entry.endTime) : "---"}</p>
                                      <p className="text-muted-foreground truncate">{entry.endLocation || "Día Libre"}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="py-16 text-center text-muted-foreground border rounded-lg">
                      <p>No hay horario configurado.</p>
                  </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Hora de Entrada</TableHead>
                    <TableHead>Lugar de Entrada</TableHead>
                    <TableHead>Hora de Salida</TableHead>
                    <TableHead>Lugar de Salida</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {schedule.map((entry) => (
                    <TableRow key={entry.day}>
                        <TableCell className="font-medium whitespace-nowrap">{entry.day}</TableCell>
                        <TableCell>{entry.startTime ? formatTime12h(entry.startTime) : "---"}</TableCell>
                        <TableCell>{entry.startLocation || "---"}</TableCell>
                        <TableCell>{entry.endTime ? formatTime12h(entry.endTime) : "---"}</TableCell>
                        <TableCell>{entry.endLocation || "---"}</TableCell>
                        <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(entry)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isGeneralDialogOpen} onOpenChange={setIsGeneralDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Crear Horario General</DialogTitle>
                <DialogDescription>
                    Define un horario de entrada y salida que se aplicará a los días seleccionados.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="general-start-time">Hora Entrada</Label>
                        <Input id="general-start-time" type="time" value={generalStartTime} onChange={e => setGeneralStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="general-end-time">Hora Salida</Label>
                        <Input id="general-end-time" type="time" value={generalEndTime} onChange={e => setGeneralEndTime(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="general-start-location">Lugar Entrada</Label>
                        <Select value={generalStartLocation} onValueChange={setGeneralStartLocation}>
                            <SelectTrigger id="general-start-location">
                                <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {userLocations.map(loc => <SelectItem key={`${loc.id}-gen-start`} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="general-end-location">Lugar Salida</Label>
                        <Select value={generalEndLocation} onValueChange={setGeneralEndLocation}>
                            <SelectTrigger id="general-end-location">
                                <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {userLocations.map(loc => <SelectItem key={`${loc.id}-gen-end`} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="apply-to-saturday" checked={applyToSaturday} onCheckedChange={(checked) => setApplyToSaturday(checked === true)} />
                    <Label htmlFor="apply-to-saturday" className="font-normal text-sm">
                        Incluir el sábado en este horario general
                    </Label>
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGeneralDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleApplyGeneralSchedule}>Aplicar a la Semana</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Horario para {editingDay?.day}</DialogTitle>
            <DialogDescription>
              Ajusta las horas y lugares para este día.
            </DialogDescription>
          </DialogHeader>
          {dayData && (
             <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora Entrada</Label>
                    <Input id="startTime" type="time" value={dayData.startTime} onChange={e => handleFieldChange('startTime', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="startLocation">Lugar Entrada</Label>
                    <Select value={dayData.startLocation || "no-location"} onValueChange={value => handleFieldChange('startLocation', value === "no-location" ? "" : value)}>
                        <SelectTrigger id="startLocation">
                            <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-location">Día Libre</SelectItem>
                            {userLocations.map(loc => (
                                <SelectItem key={`${loc.id}-start`} value={loc.name}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora Salida</Label>
                    <Input id="endTime" type="time" value={dayData.endTime} onChange={e => handleFieldChange('endTime', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endLocation">Lugar Salida</Label>
                    <Select value={dayData.endLocation || "no-location"} onValueChange={value => handleFieldChange('endLocation', value === "no-location" ? "" : value)}>
                        <SelectTrigger id="endLocation">
                            <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-location">Día Libre</SelectItem>
                            {userLocations.map(loc => (
                                <SelectItem key={`${loc.id}-end`} value={loc.name}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
            </div>
          )}
          <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
