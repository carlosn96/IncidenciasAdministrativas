"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { addDays, differenceInMinutes, format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";

// Placeholder data - In a real app, this would be fetched
type Incident = {
  date: Date;
  entryLocation: string;
  entryTime: string;
  exitLocation: string;
  exitTime: string;
};

// Helper function to calculate worked hours
const calculateWorkedHours = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "N/A";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

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

const calculateTotalMinutes = (incidents: Incident[]): number => {
  return incidents.reduce((total, incident) => {
    if (!incident.entryTime || !incident.exitTime) return total;

    const [startHour, startMinute] = incident.entryTime.split(":").map(Number);
    const [endHour, endMinute] = incident.exitTime.split(":").map(Number);

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


export default function PeriodDetailPage({ params }: { params: { id: string } }) {
  // Placeholder data - In a real app, you'd fetch this based on params.id
  const period = {
    id: params.id,
    startDate: new Date(2024, 5, 26), // June 26, 2024
    endDate: new Date(2024, 6, 10), // July 10, 2024
    includeSaturdays: true,
  };

  // Generate mock incidents for the period
  const allDays = eachDayOfInterval({ start: period.startDate, end: period.endDate });
  const incidents: Incident[] = allDays
    .map(date => {
      const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday
      if (dayOfWeek === 0) return null; // Skip Sundays
      if (dayOfWeek === 6 && !period.includeSaturdays) return null; // Skip Saturdays if not included

      // Simulate some variance in clock-in/out times
      const entryHour = 9 + Math.floor(Math.random() * 15) / 60; // 9:00 - 9:14
      const exitHour = 17 + Math.floor(Math.random() * 15) / 60; // 17:00 - 17:14
      
      return {
        date,
        entryLocation: "PLANTEL CENTRO",
        entryTime: `${String(Math.floor(entryHour)).padStart(2, '0')}:${String(Math.floor((entryHour % 1) * 60)).padStart(2, '0')}`,
        exitLocation: "PLANTEL CENTRO",
        exitTime: `${String(Math.floor(exitHour)).padStart(2, '0')}:${String(Math.floor((exitHour % 1) * 60)).padStart(2, '0')}`,
      };
    })
    .filter((incident): incident is Incident => incident !== null);

  const totalMinutesWorked = calculateTotalMinutes(incidents);
  const formattedTotalHours = formatTotalHours(totalMinutesWorked);

  const formattedDateRange = `${format(period.startDate, "d 'de' LLLL", { locale: es })} al ${format(period.endDate, "d 'de' LLLL, yyyy", { locale: es })}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver al Panel</span>
          </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold font-headline">Detalle del Periodo</h1>
            <p className="text-muted-foreground">
                Visualiza las incidencias registradas y el total de horas laboradas.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Periodo</CardTitle>
          <CardDescription>
            {formattedDateRange} (Sábados {period.includeSaturdays ? "incluidos" : "excluidos"})
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center p-6 rounded-lg bg-muted/50">
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
          <div className="border rounded-lg">
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
                    {incidents.length > 0 ? (
                        incidents.map((incident) => (
                            <TableRow key={incident.date.toISOString()}>
                                <TableCell className="font-medium capitalize">
                                    {format(incident.date, "EEEE, d 'de' LLLL", { locale: es })}
                                </TableCell>
                                <TableCell>{incident.entryLocation}</TableCell>
                                <TableCell>{incident.entryTime}</TableCell>
                                <TableCell>{incident.exitLocation}</TableCell>
                                <TableCell>{incident.exitTime}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {calculateWorkedHours(incident.entryTime, incident.exitTime)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                                <p>No hay incidencias registradas para este periodo.</p>
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
