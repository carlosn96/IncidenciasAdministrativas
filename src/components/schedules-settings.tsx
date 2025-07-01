"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import type { ScheduleEntry, Location } from "@/lib/types";
import { Pencil } from "lucide-react";

interface SchedulesSettingsProps {
    userLocations: Location[];
    schedule: ScheduleEntry[];
    setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
}

export function SchedulesSettings({ userLocations, schedule, setSchedule }: SchedulesSettingsProps) {
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDay, setEditingDay] = useState<ScheduleEntry | null>(null);
    const [dayData, setDayData] = useState<ScheduleEntry | null>(null);

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
          <CardTitle>Horario Semanal por Defecto</CardTitle>
          <CardDescription>
          Este es su horario de trabajo semanal predeterminado. Puede ser anulado por incidencias específicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
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
