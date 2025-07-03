
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
import { Pencil, PlusCircle, MoreVertical, Trash2, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";

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

    const [bulkStartTime, setBulkStartTime] = useState("");
    const [bulkEndTime, setBulkEndTime] = useState("");
    const [bulkStartLocation, setBulkStartLocation] = useState("");
    const [bulkEndLocation, setBulkEndLocation] = useState("");
    const [bulkIncludeSaturdays, setBulkIncludeSaturdays] = useState(true);
    const { toast } = useToast();

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

    const handleBulkApply = () => {
        if (!bulkStartTime || !bulkStartLocation || !bulkEndTime || !bulkEndLocation) {
            toast({
                variant: "destructive",
                title: "Datos incompletos",
                description: "Por favor, completa todos los campos del horario rápido para aplicarlo."
            });
            return;
        }

        setFormData(prev => {
            const newEntries = prev.entries.map(entry => {
                const isSaturday = entry.day === 'Sábado';
    
                // Condition to apply the bulk update
                const shouldUpdate = !isSaturday || bulkIncludeSaturdays;

                if (shouldUpdate) {
                    return {
                        ...entry,
                        startTime: bulkStartTime,
                        endTime: bulkEndTime,
                        startLocation: bulkStartLocation,
                        endLocation: bulkEndLocation,
                    };
                } else { 
                    // This case is only for Saturday when bulkIncludeSaturdays is false, so we clear it.
                    return {
                        ...entry,
                        startTime: "",
                        endTime: "",
                        startLocation: "",
                        endLocation: "",
                    };
                }
            });
            return { ...prev, entries: newEntries };
        });

        toast({
            title: "Horario Aplicado",
            description: "El horario rápido se ha aplicado a los días correspondientes."
        });
    };
    
    const isCreating = !schedule?.id;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 flex flex-col h-full max-h-[90vh]">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>{isCreating ? 'Crear Nueva Plantilla de Horario' : 'Editar Plantilla de Horario'}</DialogTitle>
                    <DialogDescription>
                        {isCreating 
                            ? 'Define un nombre y el horario para tu nueva plantilla.' 
                            : `Estás editando la plantilla "${schedule?.name}".`}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                        <Input 
                            id="template-name" 
                            placeholder="Ej. Horario de Verano"
                            value={formData.name}
                            onChange={handleNameChange}
                        />
                    </div>

                    <div className="space-y-4 rounded-md border p-4">
                        <h4 className="font-medium text-sm">Definir Horario Rápido</h4>
                        <p className="text-sm text-muted-foreground -mt-2">
                            Aplica el mismo horario a varios días a la vez. Esto modificará la tabla de abajo.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="bulk-start-time">Hora Entrada</Label>
                                <Input id="bulk-start-time" type="time" value={bulkStartTime} onChange={(e) => setBulkStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bulk-start-location">Lugar Entrada</Label>
                                <Select value={bulkStartLocation} onValueChange={setBulkStartLocation}>
                                    <SelectTrigger id="bulk-start-location"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                    <SelectContent>{userLocations.map(loc => (<SelectItem key={`${loc.id}-bulk-start`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bulk-end-time">Hora Salida</Label>
                                <Input id="bulk-end-time" type="time" value={bulkEndTime} onChange={(e) => setBulkEndTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bulk-end-location">Lugar Salida</Label>
                                <Select value={bulkEndLocation} onValueChange={setBulkEndLocation}>
                                    <SelectTrigger id="bulk-end-location"><SelectValue placeholder="Lugar..." /></SelectTrigger>
                                    <SelectContent>{userLocations.map(loc => (<SelectItem key={`${loc.id}-bulk-end`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="bulk-saturdays" checked={bulkIncludeSaturdays} onCheckedChange={(checked) => setBulkIncludeSaturdays(checked === true)} />
                                <Label htmlFor="bulk-saturdays" className="font-normal text-sm">Incluir sábados</Label>
                            </div>
                            <Button type="button" variant="secondary" onClick={handleBulkApply}>Aplicar a Días</Button>
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
                </div>

                <DialogFooter className="p-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
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
        const d = new Date();
        d.setHours(parseInt(hours), parseInt(minutes));
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
