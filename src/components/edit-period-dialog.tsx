"use client";

import { useState, useEffect } from "react";
import { format, eachDayOfInterval, getDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Period, LaborDay } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { Checkbox } from "./ui/checkbox";

interface EditPeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    period: Period | null;
}

export function EditPeriodDialog({ open, onOpenChange, period }: EditPeriodDialogProps) {
    const { setPeriods } = useSettings();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [periodName, setPeriodName] = useState("");
    const [includeSaturdays, setIncludeSaturdays] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (period && open) {
            setPeriodName(period.name);
            setDateRange({ from: period.startDate, to: period.endDate });
            setIncludeSaturdays(period.includeSaturdays || false);
        } else if (!open) {
            // Reset form when dialog is closed
            setDateRange(undefined);
            setPeriodName("");
            setIncludeSaturdays(false);
        }
    }, [period, open]);

    const handleSaveChanges = () => {
        if (!period) return;

        if (!dateRange || !dateRange.from || !dateRange.to) {
            toast({
                variant: "destructive",
                title: "Rango de fechas requerido",
                description: "Por favor, selecciona una fecha de inicio y fin para el periodo."
            });
            return;
        }

        if (!periodName.trim()) {
            toast({
                variant: "destructive",
                title: "Nombre requerido",
                description: "Por favor, proporciona un nombre para el periodo."
            });
            return;
        }

        const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        
        const newLaborDays: LaborDay[] = allDays
            .filter(day => getDay(day) !== 0) // Exclude Sundays
            .map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const existingDay = period.laborDays.find(ld => ld.date === dateStr);

                if (existingDay) {
                    return existingDay; // Keep existing data
                }

                // This is a new day, create it without any defaults.
                return { date: dateStr };
            });

        const workingDaysForCalc = newLaborDays.filter(day => {
            const dayOfWeek = getDay(parseISO(day.date));
            if (includeSaturdays) {
                return dayOfWeek !== 0; // Mon-Sat
            }
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Mon-Fri
        });

        const workingDaysCount = workingDaysForCalc.length;
        const totalDurationMinutes = workingDaysCount * 8 * 60;

        const updatedPeriod: Period = {
            ...period,
            name: periodName.trim(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            laborDays: newLaborDays,
            totalDurationMinutes: totalDurationMinutes,
            includeSaturdays: includeSaturdays,
        };

        setPeriods(prev => prev.map(p => p.id === updatedPeriod.id ? updatedPeriod : p)
                              .sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
        
        toast({
            title: "Periodo Actualizado",
            description: "El periodo ha sido actualizado exitosamente."
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Periodo</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre y el rango de fechas del periodo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="period-name">Nombre del Periodo</Label>
                        <Input
                            id="period-name"
                            value={periodName}
                            onChange={(e) => setPeriodName(e.target.value)}
                            placeholder="Ej: Segunda Quincena de Julio"
                        />
                    </div>
                    <div className="grid gap-2">
                         <Label>Rango de Fechas del Periodo</Label>
                         <div className="rounded-md border flex justify-center">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                locale={es}
                                />
                         </div>
                    </div>
                     <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="edit-include-saturdays"
                            checked={includeSaturdays} 
                            onCheckedChange={(checked) => setIncludeSaturdays(checked === true)}
                        />
                        <Label htmlFor="edit-include-saturdays" className="font-normal text-sm">
                            Incluir sábados en el cómputo de horas
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
