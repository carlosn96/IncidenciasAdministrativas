import { DailyLog } from "@/components/daily-log";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Coordinator! Here's your overview for today.
        </p>
      </div>

      <DailyLog />
    </div>
  );
}
