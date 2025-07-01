import { DailyLog } from "@/components/daily-log";
import { PeriodsList } from "@/components/periods-list";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
        <p className="text-muted-foreground">
          ¡Bienvenido de nuevo, Coordinador! Aquí está tu resumen de hoy.
        </p>
      </div>

      <DailyLog />
      <PeriodsList />
    </div>
  );
}
