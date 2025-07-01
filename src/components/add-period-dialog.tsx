"use client";

import { useState, useEffect } from "react";
import { format, addDays, eachDayOfInterval, getDay } from "date-fns";
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
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/settings-context";

interface AddPeriodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddPeriodDialog({ open, onOpenChange }: AddPeriodDialogProps) {
    const { setPeriods } = useSettings();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [periodName, setPeriodName] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (!open) {
            // Reset form when dialog is closed
            setDateRange(undefined);
            setPeriodName("");
        }
    }, [open]);

    const handleDateSelect = (range: DateRange | undefined) => {
        if (range?.from && !range.to) {
            const endDate = addDays(range.from, 15);
            setDateRange({ from: range.from, to: endDate });
        } else {
            setDateRange(range);
        }
    };

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

        const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        const newLaborDays: LaborDay[] = allDays
            .filter(day => {
                const dayOfWeek = getDay(day);
                // Exclude only Sundays
                return dayOfWeek !== 0;
            })
            .map(day => ({
                date: format(day, "yyyy-MM-dd"),
            }));

        const newPeriod: Period = {
            id: uuidv4(),
            name: periodName.trim(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            laborDays: newLaborDays
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
                         <Label>Rango de Fechas del Periodo</Label>
                         <Popover>
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
                                selected={dateRange}
                                onSelect={handleDateSelect}
                                numberOfMonths={1}
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="period-name">Nombre del Periodo</Label>
                        <Input
                            id="period-name"
                            value={periodName}
                            onChange={(e) => setPeriodName(e.target.value)}
                            placeholder="Ej: Segunda Quincena de Julio"
                            disabled={!dateRange}
                        />
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
