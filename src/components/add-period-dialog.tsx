"use client";

import { useState, useEffect } from "react";
import { format, eachDayOfInterval, getDay, parseISO, areIntervalsOverlapping } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Period, LaborDay } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { Checkbox } from "@/components/ui/checkbox";

interface AddPeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddPeriodDialog({ open, onOpenChange }: AddPeriodDialogProps) {
    const { periods, setPeriods } = useSettings();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [periodName, setPeriodName] = useState("");
    const [includeSaturdays, setIncludeSaturdays] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!open) {
            // Reset form when dialog is closed
            setDateRange(undefined);
            setPeriodName("");
            setIncludeSaturdays(false);
        }
    }, [open]);

    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            const defaultName = `Periodo del ${format(dateRange.from, "d LLL", { locale: es })} al ${format(dateRange.to, "d LLL, yyyy", { locale: es })}`;
            setPeriodName(defaultName);
        } else {
            setPeriodName("");
        }
    }, [dateRange]);

    const handleAddPeriod = () => {
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

        // Validation for overlapping periods
        const isOverlapping = periods.some(p => 
            areIntervalsOverlapping(
                { start: dateRange.from!, end: dateRange.to! },
                { start: p.startDate, end: p.endDate }
            )
        );

        if (isOverlapping) {
            toast({
                variant: "destructive",
                title: "Fechas Superpuestas",
                description: "El rango de fechas seleccionado se superpone con un periodo existente. Por favor, elige un rango diferente."
            });
            return;
        }

        const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        const newLaborDays: LaborDay[] = allDays
            .filter(day => getDay(day) !== 0) // Exclude Sundays
            .map(day => ({
                date: format(day, "yyyy-MM-dd"),
            }));

        const workingDaysForCalc = newLaborDays.filter(day => {
            const dayOfWeek = getDay(parseISO(day.date));
            if (includeSaturdays) {
                return dayOfWeek !== 0; // Mon-Sat
            }
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Mon-Fri
        });

        const workingDaysCount = workingDaysForCalc.length;
        const totalDurationMinutes = workingDaysCount * 8 * 60; // 8 hours per day

        const newPeriod: Period = {
            id: uuidv4(),
            name: periodName.trim(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            laborDays: newLaborDays,
            totalDurationMinutes: totalDurationMinutes,
            includeSaturdays: includeSaturdays,
        };

        setPeriods(prev => [newPeriod, ...prev].sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
        toast({
            title: "Periodo Agregado",
            description: "El nuevo periodo ha sido agregado exitosamente."
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Periodo</DialogTitle>
                    <DialogDescription>
                        Define el rango de fechas para el nuevo periodo quincenal.
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
                            disabled={!dateRange?.from || !dateRange.to}
                        />
                    </div>
                     <div className="grid gap-2">
                         <Label>Rango de Fechas del Periodo</Label>
                         <div className="rounded-md border flex justify-center">
                            <Calendar
                                initialFocus
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                locale={es}
                            />
                         </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="include-saturdays"
                            checked={includeSaturdays} 
                            onCheckedChange={(checked) => setIncludeSaturdays(checked === true)}
                        />
                        <Label htmlFor="include-saturdays" className="font-normal text-sm">
                            Incluir sábados en el cómputo de horas
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAddPeriod}>Agregar Periodo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
