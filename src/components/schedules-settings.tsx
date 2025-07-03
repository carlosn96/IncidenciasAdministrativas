
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { DaySchedule, Location, Schedule } from "@/lib/types";
import { Pencil, PlusCircle, MoreVertical, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// --- ScheduleEditDialog (New Component) ---

const BLANK_SCHEDULE_ENTRIES: DaySchedule[] = [
    { day: "Lunes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Martes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Miércoles", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Jueves", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Viernes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

const BLANK_SCHEDULE: Schedule = {
    id: '', // Empty id means it's a new one
    name: '',
    entries: BLANK_SCHEDULE_ENTRIES
};

interface ScheduleEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    schedule: Schedule | null; // null for create, object for edit
    onSave: (schedule: Schedule) => void;
    userLocations: Location[];
}

function ScheduleEditDialog({ isOpen, onOpenChange, schedule, onSave, userLocations }: ScheduleEditDialogProps) {
    const [formData, setFormData] = useState<Schedule>(() => {
        // Deep copy to prevent mutating parent state
        return schedule ? JSON.parse(JSON.stringify(schedule)) : JSON.parse(JSON.stringify(BLANK_SCHEDULE));
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, name: e.target.value}));
    };

    const handleEntryChange = (day: DaySchedule['day'], field: keyof Omit<DaySchedule, 'day'>, value: string) => {
        setFormData(prev => ({
            ...prev,
            entries: prev.entries.map(entry => 
                entry.day === day ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const handleSaveChanges = () => {
        onSave(formData);
    };
    
    const isCreating = !schedule?.id;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{isCreating ? 'Crear Nueva Plantilla de Horario' : 'Editar Plantilla de Horario'}</DialogTitle>
                    <DialogDescription>
                        {isCreating 
                            ? 'Define un nombre y el horario para tu nueva plantilla.' 
                            : `Estás editando la plantilla "${schedule?.name}".`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input 
                            id="template-name" 
                            placeholder="Ej. Horario de Verano"
                            value={formData.name}
                            onChange={handleNameChange}
                        />
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Día</TableHead>
                                <TableHead>Hora Entrada</TableHead>
                                <TableHead>Lugar Entrada</TableHead>
                                <TableHead>Hora Salida</TableHead>
                                <TableHead>Lugar Salida</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.entries.map(entry => (
                                <TableRow key={entry.day}>
                                    <TableCell className="font-medium">{entry.day}</TableCell>
                                    <TableCell><Input className="min-w-[100px]" type="time" value={entry.startTime} onChange={e => handleEntryChange(entry.day, 'startTime', e.target.value)} /></TableCell>
                                    <TableCell>
                                        <Select value={entry.startLocation || "no-location"} onValueChange={value => handleEntryChange(entry.day, 'startLocation', value === "no-location" ? "" : value)}>
                                            <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                            <SelectContent><SelectItem value="no-location">Día Libre</SelectItem>{userLocations.map(loc => (<SelectItem key={`${loc.id}-${entry.day}-start`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell><Input className="min-w-[100px]" type="time" value={entry.endTime} onChange={e => handleEntryChange(entry.day, 'endTime', e.target.value)} /></TableCell>
                                    <TableCell>
                                        <Select value={entry.endLocation || "no-location"} onValueChange={value => handleEntryChange(entry.day, 'endLocation', value === "no-location" ? "" : value)}>
                                            <SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                            <SelectContent><SelectItem value="no-location">Día Libre</SelectItem>{userLocations.map(loc => (<SelectItem key={`${loc.id}-${entry.day}-end`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main SchedulesSettings Component ---

interface SchedulesSettingsProps {
    userLocations: Location[];
    schedules: Schedule[];
    setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
    activeScheduleId: string | null;
    setActiveScheduleId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function SchedulesSettings({ userLocations, schedules, setSchedules, activeScheduleId, setActiveScheduleId }: SchedulesSettingsProps) {
    const { toast } = useToast();
    
    // Dialog states
    const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
    const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
    const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
    
    const activeSchedule = useMemo(() => schedules.find(s => s.id === activeScheduleId), [schedules, activeScheduleId]);

    const handleCreate = () => {
        setScheduleToEdit(null); // Indicates we are creating a new one
        setIsScheduleFormOpen(true);
    };
    
    const handleEdit = () => {
        if (activeSchedule) {
            setScheduleToEdit(activeSchedule);
            setIsScheduleFormOpen(true);
        }
    };
    
    const handleDeleteTrigger = () => {
        if (activeSchedule) {
            setIsDeleteTemplateOpen(true);
        }
    }

    const handleSaveSchedule = (scheduleToSave: Schedule) => {
        // Validation
        if (!scheduleToSave.name.trim()) {
            toast({ variant: "destructive", title: "Nombre Requerido", description: "La plantilla debe tener un nombre." });
            return;
        }
        if (schedules.some(s => s.name.toLowerCase() === scheduleToSave.name.trim().toLowerCase() && s.id !== scheduleToSave.id)) {
            toast({ variant: "destructive", title: "Nombre Duplicado", description: "Ya existe una plantilla con este nombre." });
            return;
        }
        for (const entry of scheduleToSave.entries) {
            if (entry.startTime && entry.endTime && entry.startTime > entry.endTime) {
                toast({ variant: "destructive", title: "Error de Horario", description: `En ${entry.day}, la hora de salida no puede ser anterior a la de entrada.` });
                return;
            }
        }
        
        // If it's a new schedule
        if (!scheduleToSave.id) {
             const newSchedule = {
                ...scheduleToSave,
                id: uuidv4(),
                name: scheduleToSave.name.trim()
            };
            setSchedules(prev => [...prev, newSchedule]);
            setActiveScheduleId(newSchedule.id);
            toast({ title: "Plantilla Creada", description: `Se creó la plantilla '${newSchedule.name}'.` });
        } else { // If we're editing an existing one
            setSchedules(prev => prev.map(s => s.id === scheduleToSave.id ? scheduleToSave : s));
            toast({ title: "Plantilla Actualizada", description: `Se guardaron los cambios en '${scheduleToSave.name}'.` });
        }
        
        setIsScheduleFormOpen(false);
        setScheduleToEdit(null);
    };
    
    const handleDeleteTemplate = () => {
        if (!activeScheduleId) return;
        setSchedules(prev => prev.filter(s => s.id !== activeScheduleId));
        // Set new active schedule to the first one in the list, or null if empty
        const newSchedules = schedules.filter(s => s.id !== activeScheduleId);
        setActiveScheduleId(newSchedules.length > 0 ? newSchedules[0].id : null);
        toast({ title: "Plantilla Eliminada" });
        setIsDeleteTemplateOpen(false);
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
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex-1">
                    <CardTitle>Plantillas de Horario</CardTitle>
                    <CardDescription>
                        Crea y gestiona tus horarios semanales por defecto. El horario activo se usará para las proyecciones.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={activeScheduleId || ""} onValueChange={setActiveScheduleId} disabled={schedules.length === 0}>
                        <SelectTrigger className="w-full sm:w-[250px]">
                            <SelectValue placeholder="Selecciona una plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                            {schedules.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon"><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleCreate}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Crear Nueva Plantilla
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleEdit} disabled={!activeSchedule}>
                                <Pencil className="mr-2 h-4 w-4"/> Editar Plantilla Activa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem 
                                onClick={handleDeleteTrigger} 
                                disabled={!activeSchedule || schedules.length <= 1} 
                                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            >
                                <Trash2 className="mr-2 h-4 w-4"/> Eliminar Plantilla Activa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
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
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!activeSchedule ? (
                        <TableRow><TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                            {schedules.length > 0 ? "Selecciona una plantilla para verla." : "No has creado ninguna plantilla de horario."}
                        </TableCell></TableRow>
                    ) : activeSchedule.entries.map((entry) => (
                    <TableRow key={entry.day}>
                        <TableCell className="font-medium whitespace-nowrap">{entry.day}</TableCell>
                        <TableCell>{entry.startTime ? formatTime12h(entry.startTime) : "---"}</TableCell>
                        <TableCell>{entry.startLocation || "---"}</TableCell>
                        <TableCell>{entry.endTime ? formatTime12h(entry.endTime) : "---"}</TableCell>
                        <TableCell>{entry.endLocation || "---"}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      
      {isScheduleFormOpen && (
        <ScheduleEditDialog
            isOpen={isScheduleFormOpen}
            onOpenChange={setIsScheduleFormOpen}
            schedule={scheduleToEdit}
            onSave={handleSaveSchedule}
            userLocations={userLocations}
        />
      )}

      <AlertDialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la plantilla de horario.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
