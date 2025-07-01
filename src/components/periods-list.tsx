
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Period } from "@/lib/types";
import { PlusCircle, ArrowRight, Pencil } from "lucide-react";
import { AddPeriodDialog } from "@/components/add-period-dialog";
import { EditPeriodDialog } from "@/components/edit-period-dialog";
import { cn } from "@/lib/utils";

interface PeriodsListProps {
    periods: Period[];
}

export function PeriodsList({ periods }: PeriodsListProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

    const handleEditClick = (period: Period) => {
        setSelectedPeriod(period);
        setIsEditDialogOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
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
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {periods.length > 0 ? (
                            <div className="border rounded-lg">
                                {periods.map((period, index) => (
                                    <div key={period.id} className={cn("p-4", index < periods.length - 1 && "border-b")}>
                                        <p className="font-medium">{period.name}</p>
                                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                                            {`${format(period.startDate, "d 'de' LLL", { locale: es })} - ${format(period.endDate, "d 'de' LLL, yyyy", { locale: es })}`}
                                        </p>
                                        <div className="mt-4 flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(period)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </Button>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/period/${period.id}`}>
                                                    Ver Incidencias
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center text-muted-foreground border rounded-lg">
                                <p>No hay periodos agregados.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Periodo</TableHead>
                                    <TableHead>Rango del Periodo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            No hay periodos agregados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    periods.map((period) => (
                                        <TableRow key={period.id}>
                                            <TableCell className="font-medium">{period.name}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {`${format(period.startDate, "d 'de' LLL", { locale: es })} - ${format(period.endDate, "d 'de' LLL, yyyy", { locale: es })}`}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(period)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </Button>
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

            <AddPeriodDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
            <EditPeriodDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} period={selectedPeriod} />
        </>
    );
}
