
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { differenceInMinutes, format, parse, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { LaborDay, Incident } from "@/lib/types";
import { useSettings } from "@/context/settings-context";
import { cn } from "@/lib/utils";

// Helper function to calculate worked hours
const calculateWorkedHours = (entry?: Incident, exit?: Incident): string => {
  if (!entry?.time || !exit?.time) return "N/A";

  const [startHour, startMinute] = entry.time.split(":").map(Number);
  const [endHour, endMinute] = exit.time.split(":").map(Number);

  const startDate = new Date(0);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(0);
  endDate.setHours(endHour, endMinute, 0, 0);

  const diffMinutes = differenceInMinutes(endDate, startDate);
  if (diffMinutes < 0) return "N/A";

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}h ${minutes}m`;
};

const calculateTotalMinutes = (days: LaborDay[]): number => {
  return days.reduce((total, day) => {
    if (!day.entry?.time || !day.exit?.time) return total;

    const [startHour, startMinute] = day.entry.time.split(":").map(Number);
    const [endHour, endMinute] = day.exit.time.split(":").map(Number);

    const startDate = new Date(0);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(0);
    endDate.setHours(endHour, endMinute, 0, 0);

    const diffMinutes = differenceInMinutes(endDate, startDate);
    return total + (diffMinutes > 0 ? diffMinutes : 0);
  }, 0);
};

const formatTotalHours = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} horas ${minutes} minutos`;
};

const formatTime12h = (timeStr?: string): string => {
  if (!timeStr) return "---";
  try {
    const time = parse(timeStr, "HH:mm", new Date());
    return format(time, "p", { locale: es });
  } catch (error) {
    return "---";
  }
};


export default function PeriodDetailPage({ params }: { params: { id: string } }) {
  const { periods } = useSettings();
  const period = periods.find(p => p.id === params.id);

  if (!period) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Periodo no encontrado</h1>
        <p className="text-muted-foreground mt-2">
          El periodo que buscas no existe. Por favor, vuelve a intentarlo.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Ajustes de Periodos
          </Link>
        </Button>
      </div>
    )
  }

  const laborDays = period.laborDays;
  const totalMinutesWorked = calculateTotalMinutes(laborDays);
  const formattedTotalHours = formatTotalHours(totalMinutesWorked);

  const formattedDateRange = `${format(period.startDate, "d 'de' LLLL", { locale: es })} al ${format(period.endDate, "d 'de' LLLL, yyyy", { locale: es })}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a Ajustes</span>
          </Link>
        </Button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Detalle del Periodo</h1>
            <p className="text-muted-foreground">
                Visualiza las incidencias registradas y el total de horas laboradas.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{period.name}</CardTitle>
          <CardDescription>
            {formattedDateRange} (Sábados {period.includeSaturdays ? "incluidos" : "excluidos"})
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center p-4 md:p-6 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-12 w-12 mr-4">
                    <Clock className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Total de Horas Laboradas en el Periodo</p>
                    <p className="text-2xl font-bold">{formattedTotalHours}</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporte de Incidencias</CardTitle>
          <CardDescription>
            Detalle de entradas y salidas para cada día del periodo seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden">
            {laborDays.length > 0 ? (
                <div className="border rounded-lg">
                    {laborDays.map((day, index) => (
                        <div key={day.date} className={cn("p-4", index < laborDays.length - 1 && "border-b")}>
                            <div className="flex justify-between items-baseline mb-2">
                                <p className="font-medium capitalize">
                                    {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                                </p>
                                <p className="font-mono font-semibold text-right">
                                    {calculateWorkedHours(day.entry, day.exit)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                <div>
                                    <p className="font-semibold text-muted-foreground">Entrada</p>
                                    <p>{formatTime12h(day.entry?.time)}</p>
                                    <p className="text-muted-foreground">{day.entry?.location || '---'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-muted-foreground">Salida</p>
                                    <p>{formatTime12h(day.exit?.time)}</p>
                                    <p className="text-muted-foreground">{day.exit?.location || '---'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16 border rounded-lg">
                    <p>No hay días laborables configurados para este periodo.</p>
                </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Lugar Entrada</TableHead>
                        <TableHead>Hora Entrada</TableHead>
                        <TableHead>Lugar Salida</TableHead>
                        <TableHead>Hora Salida</TableHead>
                        <TableHead className="text-right">Horas Laboradas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {laborDays.length > 0 ? (
                        laborDays.map((day) => (
                            <TableRow key={day.date}>
                                <TableCell className="font-medium capitalize whitespace-nowrap">
                                    {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                                </TableCell>
                                <TableCell>{day.entry?.location || '---'}</TableCell>
                                <TableCell>{formatTime12h(day.entry?.time)}</TableCell>
                                <TableCell>{day.exit?.location || '---'}</TableCell>
                                <TableCell>{formatTime12h(day.exit?.time)}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {calculateWorkedHours(day.entry, day.exit)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                                <p>No hay días laborables configurados para este periodo.</p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
