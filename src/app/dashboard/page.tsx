"use client";

import { useState } from "react";
import { DailyLog } from "@/components/daily-log";
import { PeriodsList } from "@/components/periods-list";
import type { Period } from "@/lib/types";

export default function DashboardPage() {
  const [periods, setPeriods] = useState<Period[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
        <p className="text-muted-foreground">
          ¡Bienvenido de nuevo, Coordinador! Aquí está tu resumen de hoy.
        </p>
      </div>

      <DailyLog periods={periods} setPeriods={setPeriods} />
      <PeriodsList periods={periods} setPeriods={setPeriods} />
    </div>
  );
}
