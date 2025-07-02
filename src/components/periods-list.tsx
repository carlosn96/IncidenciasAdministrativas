
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Period } from "@/lib/types";
import { PlusCircle, ArrowRight, Pencil, MoreHorizontal } from "lucide-react";
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
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium truncate">{period.name}</p>
                                                <p className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {`${format(period.startDate, "d 'de' LLL", { locale: es })} - ${format(period.endDate, "d 'de' LLL, yyyy", { locale: es })}`}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/period/${period.id}`} className="w-full">
                                                            <ArrowRight className="mr-2 h-4 w-4" />
                                                            <span>Ver Incidencias</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(period)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
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
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <span className="sr-only">Abrir menú de acciones</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/period/${period.id}`}>
                                                                <ArrowRight className="mr-2 h-4 w-4" />
                                                                <span>Ver Incidencias</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditClick(period)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Editar</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
