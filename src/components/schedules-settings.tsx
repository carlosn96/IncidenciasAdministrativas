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
}

const initialScheduleData: ScheduleEntry[] = [
  { day: "Lunes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Martes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Miércoles", startTime: "09:00", endTime: "13:00", startLocation: "PLANTEL TORRE UNE", endLocation: "PLANTEL TORRE UNE" },
  { day: "Jueves", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Viernes", startTime: "09:00", endTime: "15:00", startLocation: "PLANTEL ZAPOPAN", endLocation: "PLANTEL ZAPOPAN" },
  { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

export function SchedulesSettings({ userLocations }: SchedulesSettingsProps) {
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
                <Button onClick={handleOpenDialog}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Horario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                    <DialogTitle>Editar Horario por Defecto</DialogTitle>
                    <DialogDescription>
                        Realice cambios en su horario semanal aquí. Haga clic en guardar cuando haya terminado.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Día</TableHead>
                                    <TableHead>Hora Entrada</TableHead>
                                    <TableHead>Lugar Entrada</TableHead>
                                    <TableHead>Hora Salida</TableHead>
                                    <TableHead>Lugar Salida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {editableSchedule.map((entry, index) => (
                                <TableRow key={entry.day}>
                                    <TableCell className="font-medium">{entry.day}</TableCell>
                                    <TableCell>
                                        <Input type="time" value={entry.startTime} onChange={e => handleScheduleChange(index, 'startTime', e.target.value)} />
                                    </TableCell>
                                     <TableCell>
                                        <Select value={entry.startLocation} onValueChange={value => handleScheduleChange(index, 'startLocation', value || "")}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {userLocations.map(loc => (
                                                    <SelectItem key={`${loc.id}-start`} value={loc.name}>{loc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="time" value={entry.endTime} onChange={e => handleScheduleChange(index, 'endTime', e.target.value)} />
                                    </TableCell>
                                    <TableCell>
                                        <Select value={entry.endLocation} onValueChange={value => handleScheduleChange(index, 'endLocation', value || "")}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {userLocations.map(loc => (
                                                    <SelectItem key={`${loc.id}-end`} value={loc.name}>{loc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
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
                <TableHead>Lugar de Entrada</TableHead>
                <TableHead>Hora de Salida</TableHead>
                <TableHead>Lugar de Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((entry) => (
                <TableRow key={entry.day}>
                  <TableCell className="font-medium">{entry.day}</TableCell>
                  <TableCell>{formatTime12h(entry.startTime)}</TableCell>
                  <TableCell>{entry.startLocation || "---"}</TableCell>
                  <TableCell>{formatTime12h(entry.endTime)}</TableCell>
                  <TableCell>{entry.endLocation || "---"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
