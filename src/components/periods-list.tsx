"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, addDays, eachDayOfInterval, getDay } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Period, LaborDay } from "@/lib/types";
import { Calendar as CalendarIcon, PlusCircle, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PeriodsListProps {
    periods: Period[];
    setPeriods: React.Dispatch<React.SetStateAction<Period[]>>;
}

export function PeriodsList({ periods, setPeriods }: PeriodsListProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [includeSaturdays, setIncludeSaturdays] = useState(false);
    const [periodName, setPeriodName] = useState("");
    const { toast } = useToast();

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

    
    const handleSaturdaysCheckedChange = (checked: boolean | string) => {
        setIncludeSaturdays(Boolean(checked));
    };


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
                if (dayOfWeek === 0) return false;
                if (dayOfWeek === 6 && !includeSaturdays) return false;
                return true;
            })
            .map(day => ({
                date: format(day, "yyyy-MM-dd"),
            }));

        const newPeriod: Period = {
            id: uuidv4(),
            name: periodName.trim(),
            startDate: dateRange.from,
            endDate: dateRange.to,
            includeSaturdays: includeSaturdays,
            laborDays: newLaborDays
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
        setPeriodName("");
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
                                    <TableHead>Nombre del Periodo</TableHead>
                                    <TableHead>Rango del Periodo</TableHead>
                                    <TableHead>Sábados Incluidos</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No hay periodos agregados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    periods.map((period) => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-medium">{period.name}</TableCell>
                                            <TableCell>
                                                {`${format(period.startDate, "d 'de' LLL", { locale: es })} - ${format(period.endDate, "d 'de' LLL, yyyy", { locale: es })}`}
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
