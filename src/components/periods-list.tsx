
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Period } from "@/lib/types";
import { PlusCircle, ArrowRight, Pencil, MoreHorizontal, Trash2, BarChart } from "lucide-react";
import { AddPeriodDialog } from "@/components/add-period-dialog";
import { EditPeriodDialog } from "@/components/edit-period-dialog";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";

interface PeriodsListProps {
    periods: Period[];
}

export function PeriodsList({ periods }: PeriodsListProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

    // State for delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [periodToDelete, setPeriodToDelete] = useState<Period | null>(null);
    
    const router = useRouter();
    const { updatePeriods } = useSettings();
    const { toast } = useToast();

    const handleEditClick = (period: Period) => {
        setSelectedPeriod(period);
        setIsEditDialogOpen(true);
    };

    const handleDeleteTrigger = (period: Period) => {
        setPeriodToDelete(period);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePeriod = () => {
        if (!periodToDelete) return;
        updatePeriods(prev => prev.filter(p => p.id !== periodToDelete.id));
        toast({
            title: "Periodo Eliminado",
            description: "El periodo ha sido eliminado exitosamente.",
        });
        setIsDeleteDialogOpen(false);
        setPeriodToDelete(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="p-4 border-b">
                    <div className="flex justify-end items-center gap-4">
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Periodo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {periods.length > 0 ? (
                            <div className="divide-y">
                                {periods.map((period) => (
                                    <div key={period.id} className="p-4">
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
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/period/${period.id}`)} className="cursor-pointer">
                                                        <ArrowRight className="mr-2 h-4 w-4" />
                                                        <span>Ver Incidencias</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/projections?period=${period.id}`)} className="cursor-pointer">
                                                        <BarChart className="mr-2 h-4 w-4" />
                                                        <span>Realizar Proyección</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(period)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteTrigger(period)}
                                                        className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Eliminar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center text-muted-foreground">
                                <p>No hay periodos agregados.</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
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
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-16">
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
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/period/${period.id}`)} className="cursor-pointer">
                                                            <ArrowRight className="mr-2 h-4 w-4" />
                                                            <span>Ver Incidencias</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projections?period=${period.id}`)} className="cursor-pointer">
                                                            <BarChart className="mr-2 h-4 w-4" />
                                                            <span>Realizar Proyección</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditClick(period)} className="cursor-pointer">
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Editar</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteTrigger(period)}
                                                            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Eliminar</span>
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
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente
                            el periodo y todas sus incidencias asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPeriodToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePeriod}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
