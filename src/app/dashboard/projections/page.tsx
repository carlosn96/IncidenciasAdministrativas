
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/context/settings-context";
import type { Period, LaborDay, Incident } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Save, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper functions
const calculateMinutes = (entry?: Incident, exit?: Incident): number => {
  if (!entry?.time || !exit?.time) return 0;
  const [startHour, startMinute] = entry.time.split(":").map(Number);
  const [endHour, endMinute] = exit.time.split(":").map(Number);
  const startDate = new Date(0);
  startDate.setHours(startHour, startMinute, 0, 0);
  const endDate = new Date(0);
  endDate.setHours(endHour, endMinute, 0, 0);
  const diff = differenceInMinutes(endDate, startDate);
  return diff > 0 ? diff : 0;
};

const formatMinutesToHours = (totalMinutes: number): string => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${isNegative ? '-' : ''}${hours}h ${minutes}m`;
};

export default function ProjectionsPage() {
  const { periods, setPeriods } = useSettings();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [projections, setProjections] = useState<LaborDay[]>([]);
  const { toast } = useToast();

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId);
  }, [selectedPeriodId, periods]);

  useEffect(() => {
    if (selectedPeriod) {
      // Deep copy to avoid mutating the original state directly
      setProjections(JSON.parse(JSON.stringify(selectedPeriod.laborDays)));
    } else {
      setProjections([]);
    }
  }, [selectedPeriod]);

  const handleProjectionChange = (date: string, type: 'projectedEntry' | 'projectedExit', time: string) => {
    setProjections(prevProjections =>
      prevProjections.map(day => {
        if (day.date === date) {
          const updatedDay = { ...day };
          if (!updatedDay[type]) {
             updatedDay[type] = { time: "", location: "" }; // Initialize if not present
          }
          updatedDay[type]!.time = time;
          return updatedDay;
        }
        return day;
      })
    );
  };

  const handleSaveChanges = () => {
    if (!selectedPeriodId) return;

    setPeriods(prevPeriods =>
      prevPeriods.map(p => {
        if (p.id === selectedPeriodId) {
          return { ...p, laborDays: projections };
        }
        return p;
      })
    );
    toast({
      title: "Proyecciones Guardadas",
      description: "Tus cambios en la planificación han sido guardados.",
    });
  };
  
  const stats = useMemo(() => {
    if (!selectedPeriod || projections.length === 0) return null;

    const totalMinutesExpected = selectedPeriod.totalDurationMinutes || 0;
    const totalMinutesActual = projections.reduce((total, day) => total + calculateMinutes(day.entry, day.exit), 0);
    const totalMinutesProjected = projections.reduce((total, day) => {
        // Use actual if present, otherwise use projected
        const entry = day.entry || day.projectedEntry;
        const exit = day.exit || day.projectedExit;
        return total + calculateMinutes(entry, exit);
    }, 0);

    const difference = totalMinutesProjected - totalMinutesExpected;

    return {
      expected: formatMinutesToHours(totalMinutesExpected),
      actual: formatMinutesToHours(totalMinutesActual),
      projected: formatMinutesToHours(totalMinutesProjected),
      difference: formatMinutesToHours(difference),
      differenceMinutes: difference,
    };

  }, [selectedPeriod, projections]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Planificador de Periodo</h1>
        <p className="text-muted-foreground">
          Proyecta tus horas de trabajo para planificar tu quincena y asegurar que cumples tus metas.
        </p>
      </div>

      <Card>
        {periods.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground border rounded-lg border-dashed">
              <BarChart className="h-12 w-12 mb-4 text-muted-foreground/50"/>
              <h3 className="text-xl font-semibold text-card-foreground">No Tienes Periodos</h3>
              <p className="mt-2 mb-6 max-w-sm">
                  Para poder planificar tus horas, primero necesitas crear un periodo de trabajo.
              </p>
              <Button asChild>
                  <Link href="/dashboard/settings?tab=periods">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Crear Nuevo Periodo
                  </Link>
              </Button>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Selecciona un Periodo</CardTitle>
              <div className="max-w-sm pt-2">
                <Select onValueChange={setSelectedPeriodId} value={selectedPeriodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un periodo para planificar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            {selectedPeriod ? (
              <CardContent className="space-y-6">
                {stats && (
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle>Resumen de Proyección</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Meta del Periodo</p>
                                    <p className="text-xl font-bold">{stats.expected}</p>
                                </div>
                                 <div>
                                    <p className="text-sm text-muted-foreground">Total Real</p>
                                    <p className="text-xl font-bold">{stats.actual}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Proyectado</p>
                                    <p className="text-xl font-bold">{stats.projected}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Balanza</p>
                                    <p className={cn("text-xl font-bold", stats.differenceMinutes < 0 ? "text-destructive" : "text-green-600")}>{stats.difference}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
    
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Entrada Proyectada</TableHead>
                        <TableHead>Salida Proyectada</TableHead>
                        <TableHead className="text-right">Horas Proyectadas</TableHead>
                        <TableHead className="text-right">Horas Reales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projections.map((day) => {
                        const projectedMinutes = calculateMinutes(day.projectedEntry, day.projectedExit);
                        const actualMinutes = calculateMinutes(day.entry, day.exit);
    
                        return (
                            <TableRow key={day.date} className={cn(actualMinutes > 0 && "bg-green-500/10")}>
                            <TableCell className="font-medium capitalize whitespace-nowrap">
                              {format(parseISO(day.date), "EEEE, d 'de' LLLL", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={day.projectedEntry?.time || ""}
                                onChange={(e) => handleProjectionChange(day.date, 'projectedEntry', e.target.value)}
                                className="w-32"
                                disabled={!!day.entry}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={day.projectedExit?.time || ""}
                                onChange={(e) => handleProjectionChange(day.date, 'projectedExit', e.target.value)}
                                className="w-32"
                                disabled={!!day.exit}
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatMinutesToHours(projectedMinutes)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatMinutesToHours(actualMinutes)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges}>
                        <Save className="mr-2 h-4 w-4"/>
                        Guardar Proyección
                    </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground border rounded-lg border-dashed">
                    <BarChart className="h-12 w-12 mb-4 text-muted-foreground/50"/>
                    <p className="font-medium">No has seleccionado un periodo.</p>
                    <p className="text-sm">Por favor, elige un periodo de la lista de arriba para empezar a planificar.</p>
                </div>
              </CardContent>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
