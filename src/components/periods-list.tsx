"use client";

import { useState } from "react";
import Link from "next/link";
import { addDays, format, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Period } from "@/lib/types";
import { Calendar as CalendarIcon, PlusCircle, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const initialPeriods: Period[] = [];

export function PeriodsList() {
    const [periods, setPeriods] = useState<Period[]>(initialPeriods);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [includeSaturdays, setIncludeSaturdays] = useState(false);
    const { toast } = useToast();

    const calculateEndDate = (startDate: Date, SaturdaysIncluded: boolean): Date => {
        let currentDate = startDate;
        let businessDaysCount = 1; // Start counting from the start date
        // We need 15 days total, so we iterate until we find 14 more.
        while (businessDaysCount < 15) {
            currentDate = addDays(currentDate, 1);
            const dayOfWeek = getDay(currentDate);

            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            if (isSunday || (isSaturday && !SaturdaysIncluded)) {
                continue;
            }
            
            businessDaysCount++;
        }
        return currentDate;
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        if (range?.from && !range.to) {
            const endDate = calculateEndDate(range.from, includeSaturdays);
            setDateRange({ from: range.from, to: endDate });
        } else {
            setDateRange(range);
        }
    };
    
    const handleSaturdaysCheckedChange = (checked: boolean | string) => {
        const isChecked = Boolean(checked);
        setIncludeSaturdays(isChecked);

        if (dateRange?.from) {
            const newEndDate = calculateEndDate(dateRange.from, isChecked);
            setDateRange(currentRange => ({ ...currentRange, from: currentRange?.from, to: newEndDate }));
        }
    };


    const handleAddPeriod = () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            toast({
                variant: "destructive",
                title: "Fechas requeridas",
                description: "Por favor, selecciona un rango de fechas para el periodo."
            });
            return;
        }

        const newPeriod: Period = {
            id: uuidv4(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            includeSaturdays: includeSaturdays
        };

        setPeriods(prev => [newPeriod, ...prev].sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
        toast({
            title: "Periodo Agregado",
            description: "El nuevo periodo ha sido agregado exitosamente."
        });

        // Reset form
        setIsAddDialogOpen(false);
        setDateRange(undefined);
        setIncludeSaturdays(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Periodos de Incidencias</CardTitle>
                            <CardDescription>Gestiona tus periodos quincenales de registro.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Periodo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rango del Periodo</TableHead>
                                    <TableHead>Sábados Incluidos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No hay periodos agregados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    periods.map((period) => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-medium">
                                                {`${format(period.startDate, "d 'de' LLLL", { locale: es })} al ${format(period.endDate, "d 'de' LLLL, yyyy", { locale: es })}`}
                                            </TableCell>
                                            <TableCell>{period.includeSaturdays ? "Sí" : "No"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/dashboard/period/${period.id}`}>
                                                        Ver Incidencias
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Periodo</DialogTitle>
                        <DialogDescription>
                            Define el rango de fechas para el nuevo periodo quincenal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                             <Label>Rango de Fechas</Label>
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
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={handleDateSelect}
                                    numberOfMonths={2}
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="includeSaturdays"
                                checked={includeSaturdays}
                                onCheckedChange={handleSaturdaysCheckedChange}
                            />
                            <Label htmlFor="includeSaturdays" className="font-normal">
                                Considerar los sábados en este periodo
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddPeriod}>Agregar Periodo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
