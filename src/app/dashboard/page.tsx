"use client";

import { useState, useMemo } from "react";
import { DailyLog } from "@/components/daily-log";
import { AddPeriodDialog } from "@/components/add-period-dialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/settings-context";
import { isWithinInterval, format } from "date-fns";
import { es } from "date-fns/locale";
import { PlusCircle, CalendarDays } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { periods } = useSettings();
  const [isAddPeriodDialogOpen, setIsAddPeriodDialogOpen] = useState(false);

  const activePeriod = useMemo(() => {
    const today = new Date();
    // The periods are sorted by start date descending. The first one that includes today is the most recent one.
    return periods.find(p => isWithinInterval(today, { start: p.startDate, end: p.endDate }));
  }, [periods]);

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
            <p className="text-muted-foreground">
              ¡Bienvenido de nuevo, Coordinador! Aquí está tu resumen de hoy.
            </p>
          </div>
          <Button onClick={() => setIsAddPeriodDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Periodo
          </Button>
        </div>

        {activePeriod ? (
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full h-10 w-10">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <CardDescription>Periodo Activo</CardDescription>
                        <CardTitle className="text-xl">{activePeriod.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <p>
                    Este periodo va del <strong>{format(activePeriod.startDate, "d 'de' LLLL", { locale: es })}</strong> al <strong>{format(activePeriod.endDate, "d 'de' LLLL, yyyy", { locale: es })}</strong>.
                </p>
                </CardContent>
            </Card>
        ) : (
            <Card className="border-dashed">
                <CardHeader className="text-center p-6">
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

        <DailyLog />
      </div>
      <AddPeriodDialog open={isAddPeriodDialogOpen} onOpenChange={setIsAddPeriodDialogOpen} />
    </>
  );
}
