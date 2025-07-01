"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Location } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";

interface LocationsSettingsProps {
    userLocations: Location[];
    setUserLocations: React.Dispatch<React.SetStateAction<Location[]>>;
    allLocations: Location[];
}

export function LocationsSettings({ userLocations, setUserLocations, allLocations }: LocationsSettingsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const { toast } = useToast();

  const availableLocationsToAdd = allLocations.filter(
    (allLoc) => !userLocations.some((userLoc) => userLoc.id === allLoc.id)
  );

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const locationToAdd = allLocations.find(loc => loc.id === selectedLocationId);

    if (locationToAdd) {
        setUserLocations(prev => [...prev, locationToAdd].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
            title: "Ubicación Añadida",
            description: `Se ha añadido '${locationToAdd.name}' a tu lista personal.`,
        });
        setIsAddDialogOpen(false);
        setSelectedLocationId("");
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, selecciona una ubicación válida.",
        });
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    const locationToRemove = userLocations.find(loc => loc.id === locationId);
    setUserLocations(prev => prev.filter(loc => loc.id !== locationId));
    if (locationToRemove) {
      toast({
          title: "Ubicación Eliminada",
          description: `Se ha eliminado '${locationToRemove.name}' de tu lista personal.`,
      });
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle>Mis Ubicaciones de Trabajo</CardTitle>
                  <CardDescription>
                      Gestiona la lista de planteles donde asistes. Esta lista se usará para configurar tus horarios.
                  </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} disabled={availableLocationsToAdd.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Plantel
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Plantel</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLocations.length > 0 ? userLocations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell>{loc.campus}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Borrar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente
                                la ubicación de tu lista personalizada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteLocation(loc.id)}>
                                Continuar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No has añadido ninguna ubicación.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddLocation}>
            <DialogHeader>
              <DialogTitle>Añadir Plantel a tu Lista</DialogTitle>
              <DialogDescription>
                Selecciona un plantel de la lista de la universidad para añadirlo a tus ubicaciones frecuentes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location-select" className="text-right">Plantel</Label>
                 <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    <SelectTrigger className="col-span-3" id="location-select">
                        <SelectValue placeholder="Selecciona un plantel..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableLocationsToAdd.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Añadir a mi Lista</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
