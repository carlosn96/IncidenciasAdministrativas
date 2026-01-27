
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
import { PlusCircle, ArrowRight, Pencil, MoreHorizontal, Trash2, BarChart, CloudUpload, Calendar, Loader2 } from "lucide-react";
import { AddPeriodDialog } from "@/components/add-period-dialog";
import { EditPeriodDialog } from "@/components/edit-period-dialog";
import { useSettings } from "@/context/settings-context";
import { useToast } from "@/hooks/use-toast";
import { useSyncPeriod } from "@/hooks/use-sync-period";

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
    const [isDeleting, setIsDeleting] = useState(false);
    
    const router = useRouter();
    const { updatePeriods, user, userProfile } = useSettings();
    const { sync: syncPeriod, isSyncing } = useSyncPeriod();
    const { toast } = useToast();

    const handleEditClick = (period: Period) => {
        setSelectedPeriod(period);
        setIsEditDialogOpen(true);
    };

    const handleDeleteTrigger = (period: Period) => {
        setPeriodToDelete(period);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePeriod = async () => {
        if (!periodToDelete) return;
        setIsDeleting(true);
        // Simulate async operation or just delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
        updatePeriods(prev => prev.filter(p => p.id !== periodToDelete.id));
        toast({
            title: "Periodo Eliminado",
            description: "El periodo ha sido eliminado exitosamente.",
        });
        setIsDeleteDialogOpen(false);
        setPeriodToDelete(null);
        setIsDeleting(false);
    };

    return (
        <>
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold">Periodos</h2>
                            <p className="text-sm text-muted-foreground">Gestiona tus periodos laborales</p>
                        </div>
                        <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="shadow-sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile View */}
                    <div className="md:hidden">
                        {periods.length > 0 ? (
                            <div className="space-y-3 p-4">
                                {periods.map((period) => (
                                    <Card key={period.id} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-base truncate">{period.name}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {`${format(period.startDate, "d 'de' LLL", { locale: es })} - ${format(period.endDate, "d 'de' LLL, yyyy", { locale: es })}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 ml-2" aria-label="Abrir menú de acciones">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/period/${period.id}`)} className="cursor-pointer">
                                                            <ArrowRight className="mr-2 h-4 w-4" />
                                                            <span>Ver Incidencias</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projections?period=${period.id}`)} className="cursor-pointer">
                                                            <BarChart className="mr-2 h-4 w-4" />
                                                            <span>Realizar Proyección</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => syncPeriod(period.id, user?.uid || '')}
                                                            disabled={!userProfile?.googleRefreshToken || isSyncing}
                                                            className="cursor-pointer"
                                                        >
                                                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
                                                            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
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
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center text-muted-foreground">
                                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium">No hay periodos agregados</p>
                                <p className="text-sm">Comienza agregando tu primer periodo.</p>
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
                                        <TableRow key={period.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <Calendar className="inline mr-2 h-4 w-4 text-muted-foreground" />
                                                {period.name}
                                            </TableCell>
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
                                                        <DropdownMenuItem
                                                            onClick={() => syncPeriod(period.id, user?.uid || '')}
                                                            disabled={!userProfile?.googleRefreshToken || isSyncing}
                                                            className="cursor-pointer"
                                                        >
                                                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
                                                            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
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
                        <AlertDialogCancel disabled={isDeleting} onClick={() => setPeriodToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePeriod}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
