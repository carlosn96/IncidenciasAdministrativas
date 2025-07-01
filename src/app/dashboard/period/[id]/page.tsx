"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// This is a placeholder page. In a real app, you'd fetch period data
// based on the `params.id` and display the associated incidents.

export default function PeriodDetailPage({ params }: { params: { id: string } }) {
  // Placeholder data
  const period = {
    id: params.id,
    startDate: new Date(2024, 5, 26), // June 26, 2024
    endDate: new Date(2024, 6, 10), // July 10, 2024
    includeSaturdays: true,
  };

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
                Visualiza las incidencias registradas en este periodo.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Periodo: {formattedDateRange}</CardTitle>
          <CardDescription>
            Mostrando incidencias para el periodo seleccionado. Sábados {period.includeSaturdays ? "incluidos" : "excluidos"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-16">
            <p>Aún no se ha implementado la vista de incidencias.</p>
            <p className="text-sm">¡Vuelve pronto!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
