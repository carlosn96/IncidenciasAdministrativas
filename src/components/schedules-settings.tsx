
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { DaySchedule, Location, Schedule } from "@/lib/types";
import { Pencil, PlusCircle, MoreVertical, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

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
    const [isEditDayOpen, setIsEditDayOpen] = useState(false);
    const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
    const [isRenameTemplateOpen, setIsRenameTemplateOpen] = useState(false);
    const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
    
    // Data states for dialogs
    const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);
    const [dayData, setDayData] = useState<DaySchedule | null>(null);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [renamingTemplateName, setRenamingTemplateName] = useState("");
    
    const activeSchedule = useMemo(() => schedules.find(s => s.id === activeScheduleId), [schedules, activeScheduleId]);

    const handleOpenEditDialog = (day: DaySchedule) => {
      setEditingDay(day);
      setDayData(day);
      setIsEditDayOpen(true);
    };

    const handleFieldChange = (field: keyof Omit<DaySchedule, 'day'>, value: string) => {
      if (dayData) {
          setDayData({ ...dayData, [field]: value });
      }
    };

    const handleSaveDayChanges = () => {
      if (dayData && activeSchedule) {
          if (dayData.startTime && dayData.endTime && dayData.startTime > dayData.endTime) {
            toast({ variant: "destructive", title: "Error", description: "La hora de salida no puede ser anterior a la de entrada." });
            return;
          }
          const updatedEntries = activeSchedule.entries.map(day => (day.day === dayData.day ? dayData : day));
          const updatedSchedule = { ...activeSchedule, entries: updatedEntries };
          setSchedules(prev => prev.map(s => s.id === activeScheduleId ? updatedSchedule : s));
          toast({ title: "Horario Actualizado", description: `El horario para ${dayData.day} ha sido guardado.` });
          setIsEditDayOpen(false);
      }
    };

    const handleAddTemplate = () => {
        if (!newTemplateName.trim()) {
            toast({ variant: "destructive", title: "Nombre Requerido" });
            return;
        }
        const newSchedule: Schedule = {
            id: uuidv4(),
            name: newTemplateName,
            entries: [
                { day: "Lunes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
                { day: "Martes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
                { day: "Miércoles", startTime: "", endTime: "", startLocation: "", endLocation: "" },
                { day: "Jueves", startTime: "", endTime: "", startLocation: "", endLocation: "" },
                { day: "Viernes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
                { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
            ]
        };
        setSchedules(prev => [...prev, newSchedule]);
        setActiveScheduleId(newSchedule.id);
        toast({ title: "Plantilla Creada", description: `Se creó la plantilla '${newTemplateName}'.` });
        setIsAddTemplateOpen(false);
        setNewTemplateName("");
    };

    const handleRenameTemplate = () => {
        if (!renamingTemplateName.trim()) {
            toast({ variant: "destructive", title: "Nombre Requerido" });
            return;
        }
        setSchedules(prev => prev.map(s => s.id === activeScheduleId ? { ...s, name: renamingTemplateName } : s));
        toast({ title: "Plantilla Renombrada" });
        setIsRenameTemplateOpen(false);
        setRenamingTemplateName("");
    };
    
    const handleDeleteTemplate = () => {
        setSchedules(prev => prev.filter(s => s.id !== activeScheduleId));
        setActiveScheduleId(schedules.length > 1 ? schedules.find(s => s.id !== activeScheduleId)!.id : null);
        toast({ title: "Plantilla Eliminada" });
        setIsDeleteTemplateOpen(false);
    };

    useEffect(() => {
        if (activeSchedule) {
            setRenamingTemplateName(activeSchedule.name);
        }
    }, [isRenameTemplateOpen, activeSchedule]);

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
                            <DropdownMenuItem onClick={() => setIsAddTemplateOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Crear Nueva
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsRenameTemplateOpen(true)} disabled={!activeSchedule}>
                                <Pencil className="mr-2 h-4 w-4"/> Renombrar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => setIsDeleteTemplateOpen(true)} disabled={!activeSchedule || schedules.length <= 1} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                <Trash2 className="mr-2 h-4 w-4"/> Eliminar
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
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {!activeSchedule ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-48 text-muted-foreground">No hay ninguna plantilla de horario seleccionada.</TableCell></TableRow>
                    ) : activeSchedule.entries.map((entry) => (
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

      {/* Edit Day Dialog */}
      <Dialog open={isEditDayOpen} onOpenChange={setIsEditDayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Horario para {editingDay?.day}</DialogTitle></DialogHeader>
          {dayData && (
             <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="startTime">Hora Entrada</Label><Input id="startTime" type="time" value={dayData.startTime} onChange={e => handleFieldChange('startTime', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="startLocation">Lugar Entrada</Label><Select value={dayData.startLocation || "no-location"} onValueChange={value => handleFieldChange('startLocation', value === "no-location" ? "" : value)}><SelectTrigger id="startLocation"><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent><SelectItem value="no-location">Día Libre</SelectItem>{userLocations.map(loc => (<SelectItem key={`${loc.id}-start`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent></Select></div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="endTime">Hora Salida</Label><Input id="endTime" type="time" value={dayData.endTime} onChange={e => handleFieldChange('endTime', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="endLocation">Lugar Salida</Label><Select value={dayData.endLocation || "no-location"} onValueChange={value => handleFieldChange('endLocation', value === "no-location" ? "" : value)}><SelectTrigger id="endLocation"><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent><SelectItem value="no-location">Día Libre</SelectItem>{userLocations.map(loc => (<SelectItem key={`${loc.id}-end`} value={loc.name}>{loc.name}</SelectItem>))}</SelectContent></Select></div>
                </div>
            </div>
          )}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditDayOpen(false)}>Cancelar</Button><Button onClick={handleSaveDayChanges}>Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}><DialogContent><DialogHeader><DialogTitle>Crear Nueva Plantilla</DialogTitle></DialogHeader><div className="py-4 space-y-2"><Label htmlFor="new-name">Nombre</Label><Input id="new-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Ej: Horario de Verano"/></div><DialogFooter><Button variant="outline" onClick={()=>setIsAddTemplateOpen(false)}>Cancelar</Button><Button onClick={handleAddTemplate}>Crear</Button></DialogFooter></DialogContent></Dialog>
      
      {/* Rename Template Dialog */}
      <Dialog open={isRenameTemplateOpen} onOpenChange={setIsRenameTemplateOpen}><DialogContent><DialogHeader><DialogTitle>Renombrar Plantilla</DialogTitle></DialogHeader><div className="py-4 space-y-2"><Label htmlFor="rename-name">Nuevo Nombre</Label><Input id="rename-name" value={renamingTemplateName} onChange={(e) => setRenamingTemplateName(e.target.value)}/></div><DialogFooter><Button variant="outline" onClick={()=>setIsRenameTemplateOpen(false)}>Cancelar</Button><Button onClick={handleRenameTemplate}>Renombrar</Button></DialogFooter></DialogContent></Dialog>

      {/* Delete Template Dialog */}
      <AlertDialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la plantilla de horario.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}
