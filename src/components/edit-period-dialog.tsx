"use client";

import { useState, useEffect } from "react";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Period, LaborDay } from "@/lib/types";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";

interface EditPeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    period: Period | null;
}

export function EditPeriodDialog({ open, onOpenChange, period }: EditPeriodDialogProps) {
    const { setPeriods } = useSettings();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [periodName, setPeriodName] = useState("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (period && open) {
            setPeriodName(period.name);
            setDateRange({ from: period.startDate, to: period.endDate });
        } else if (!open) {
            // Reset form when dialog is closed
            setDateRange(undefined);
            setPeriodName("");
            setIsCalendarOpen(false);
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

        const updatedPeriod: Period = {
            ...period,
            name: periodName.trim(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            laborDays: newLaborDays
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
                         <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !dateRange && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                  dateRange.to ? (
                                    <>
                                      {format(dateRange.from, "d 'de' LLL", { locale: es })} -{" "}
                                      {format(dateRange.to, "d 'de' LLL, yyyy", { locale:es })}
                                    </>
                                  ) : (
                                    format(dateRange.from, "d 'de' LLL, yyyy", { locale: es })
                                  )
                                ) : (
                                  <span>Selecciona un rango de fechas</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                locale={es}
                              />
                              <div className="p-3 border-t">
                                <Button onClick={() => setIsCalendarOpen(false)} className="w-full">
                                    Aceptar
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
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
