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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ScheduleEntry } from "@/lib/types";

const initialScheduleData: ScheduleEntry[] = [
  { day: "Monday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Tuesday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Wednesday", startTime: "09:00", endTime: "13:00", location: "North Campus" },
  { day: "Thursday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Friday", startTime: "09:00", endTime: "15:00", location: "Remote" },
  { day: "Saturday", startTime: "", endTime: "", location: "" },
  { day: "Sunday", startTime: "", endTime: "", location: "" },
];

export function SchedulesSettings() {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
    const [editableSchedule, setEditableSchedule] = useState<ScheduleEntry[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenDialog = () => {
        setEditableSchedule(JSON.parse(JSON.stringify(schedule))); 
        setIsDialogOpen(true);
    };

    const handleScheduleChange = (index: number, field: keyof Omit<ScheduleEntry, 'day'>, value: string) => {
        const updatedSchedule = [...editableSchedule];
        updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
        setEditableSchedule(updatedSchedule);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSchedule(editableSchedule);
        toast({
            title: "Horario Actualizado",
            description: "Tu horario por defecto ha sido guardado.",
        });
        setIsDialogOpen(false);
    }
    
    const formatTime12h = (timeStr: string) => {
        if (!timeStr) return "---";
        const [hours, minutes] = timeStr.split(":");
        if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return timeStr;
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        return `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Horario Semanal por Defecto</CardTitle>
                <CardDescription>
                Este es su horario de trabajo semanal predeterminado. Puede ser anulado por incidencias específicas.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>Editar Horario</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                    <DialogTitle>Editar Horario por Defecto</DialogTitle>
                    <DialogDescription>
                        Realice cambios en su horario semanal aquí. Haga clic en guardar cuando haya terminado.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4 px-1 text-sm font-medium">
                            <Label>Día</Label>
                            <Label>Hora de Entrada</Label>
                            <Label>Hora de Salida</Label>
                            <Label>Lugar</Label>
                        </div>
                        <div className="space-y-2">
                        {editableSchedule.map((entry, index) => (
                            <div key={entry.day} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`${entry.day}-day`} className="font-medium">{entry.day}</Label>
                                <Input id={`${entry.day}-start`} type="time" value={entry.startTime} onChange={e => handleScheduleChange(index, 'startTime', e.target.value)} />
                                <Input id={`${entry.day}-end`} type="time" value={entry.endTime} onChange={e => handleScheduleChange(index, 'endTime', e.target.value)} />
                                <Input id={`${entry.day}-location`} value={entry.location} onChange={e => handleScheduleChange(index, 'location', e.target.value)} />
                            </div>
                        ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead>Hora de Entrada</TableHead>
                <TableHead>Hora de Salida</TableHead>
                <TableHead>Lugar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((entry) => (
                <TableRow key={entry.day}>
                  <TableCell className="font-medium">{entry.day}</TableCell>
                  <TableCell>{formatTime12h(entry.startTime)}</TableCell>
                  <TableCell>{formatTime12h(entry.endTime)}</TableCell>
                  <TableCell>{entry.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
