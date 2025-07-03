
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DailyLog } from "@/components/daily-log";
import { AddPeriodDialog } from "@/components/add-period-dialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings-context";
import { isWithinInterval, format, differenceInMinutes, endOfDay, parse } from "date-fns";
import { es } from "date-fns/locale";
import { PlusCircle, CalendarDays, ArrowRight, Clock, BrainCircuit, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LaborDay } from "@/lib/types";

// Helper functions
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


export default function DashboardPage() {
  const { periods } = useSettings();
  const [isAddPeriodDialogOpen, setIsAddPeriodDialogOpen] = useState(false);

  const { activePeriod, todayLaborDay } = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const activePeriod = periods.find(p => isWithinInterval(today, { start: p.startDate, end: endOfDay(p.endDate) }));
    const todayLaborDay = activePeriod?.laborDays.find(ld => ld.date === todayStr);
    
    return { activePeriod, todayLaborDay };
  }, [periods]);

  const periodStats = useMemo(() => {
    if (!activePeriod) return null;

    const totalMinutesWorked = calculateTotalMinutes(activePeriod.laborDays);
    const formattedTotalHours = formatTotalHours(totalMinutesWorked);

    const totalMinutesExpected = activePeriod.totalDurationMinutes || 0;
    const remainingMinutes = Math.max(0, totalMinutesExpected - totalMinutesWorked);
    const formattedRemainingHours = formatTotalHours(remainingMinutes);
    const progressPercentage = totalMinutesExpected > 0 ? Math.min(100, (totalMinutesWorked / totalMinutesExpected) * 100) : 0;
    
    return {
      formattedTotalHours,
      formattedRemainingHours,
      progressPercentage
    };
  }, [activePeriod]);
  
  const showProjectedEntry = !!(todayLaborDay?.projectedEntry && !todayLaborDay.entry);
  const showProjectedExit = !!todayLaborDay?.projectedExit;
  const showProjectionCard = (showProjectedEntry || showProjectedExit) && !todayLaborDay?.exit;

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Resumen Diario</h1>
          <p className="text-muted-foreground">
            ¡Bienvenido de nuevo, Coordinador! Aquí está tu resumen de hoy.
          </p>
        </div>

        {activePeriod ? (
            <Link href={`/dashboard/period/${activePeriod.id}`} className="block group">
              <Card className="bg-primary/5 border-primary/20 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-10 w-10">
                              <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                              <CardDescription>Periodo Activo</CardDescription>
                              <CardTitle className="text-xl">{activePeriod.name}</CardTitle>
                          </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm">
                    <p className="text-muted-foreground">
                        Este periodo va del <strong>{format(activePeriod.startDate, "d 'de' LLLL", { locale: es })}</strong> al <strong>{format(activePeriod.endDate, "d 'de' LLLL, yyyy", { locale: es })}</strong>.
                    </p>
                    {periodStats && (
                        <>
                            <div className="border-t my-3 border-primary/10" />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span>Horas laboradas</span>
                                    </div>
                                    <strong className="font-semibold text-primary/90">{periodStats.formattedTotalHours}</strong>
                                </div>
                                <div className="space-y-1">
                                    <Progress value={periodStats.progressPercentage} className="h-2" />
                                    <p className="text-xs text-right text-muted-foreground">
                                      Restantes: {periodStats.formattedRemainingHours}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                  </CardContent>
              </Card>
            </Link>
        ) : (
            <Card className="border-dashed">
                <CardHeader className="text-center p-4 md:p-6">
                    <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                      <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">No hay periodo activo</CardTitle>
                    <CardDescription className="mt-2">
                        Crea un nuevo periodo para comenzar a registrar tus incidencias diarias.
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
        
        {showProjectionCard && todayLaborDay && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className="flex items-center justify-center bg-muted text-muted-foreground rounded-full h-10 w-10">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <CardDescription>Proyección para Hoy</CardDescription>
                <CardTitle className="text-xl">Plan del Día</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {showProjectedEntry && todayLaborDay.projectedEntry && (
                <div className="space-y-1">
                  <p className="font-semibold">Entrada Proyectada</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime12h(todayLaborDay.projectedEntry.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{todayLaborDay.projectedEntry.location}</span>
                  </div>
                </div>
              )}
              {showProjectedExit && todayLaborDay.projectedExit && (
                <div className="space-y-1">
                  <p className="font-semibold">Salida Proyectada</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime12h(todayLaborDay.projectedExit.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{todayLaborDay.projectedExit.location}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end -mt-4">
             <Button variant="outline" onClick={() => setIsAddPeriodDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Periodo
            </Button>
        </div>

        <DailyLog />
      </div>
      <AddPeriodDialog open={isAddPeriodDialogOpen} onOpenChange={setIsAddPeriodDialogOpen} />
    </>
  );
}
