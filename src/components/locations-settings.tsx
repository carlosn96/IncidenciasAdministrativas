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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Location } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const initialLocationsData: Location[] = [
  { id: "loc1", name: "Edificio A", campus: "Campus Principal", address: "Av. Universidad 123" },
  { id: "loc2", name: "Biblioteca", campus: "Campus Principal", address: "Av. Universidad 125" },
  { id: "loc3", name: "Centro de Ciencias", campus: "Campus Norte", address: "Calle Colegio 456" },
  { id: "loc4", name: "Oficina en Casa", campus: "Remoto", address: "N/A" },
];

export function LocationsSettings() {
  const [locations, setLocations] = useState<Location[]>(initialLocationsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", campus: "", address: "" });
  const { toast } = useToast();

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name.trim() || !newLocation.campus.trim()) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "El nombre de la ubicación y el campus son requeridos.",
        });
        return;
    }

    const newLoc: Location = {
        id: `loc${locations.length + 1}`,
        ...newLocation,
    };

    setLocations(prev => [newLoc, ...prev]);
    toast({
        title: "Ubicación Añadida",
        description: `Se ha añadido '${newLocation.name}' exitosamente.`,
    });

    setNewLocation({ name: "", campus: "", address: "" });
    setIsDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Configuración de Ubicaciones</CardTitle>
                <CardDescription>
                    Define ubicaciones de trabajo y campus para los sistemas de registro.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Añadir Ubicación</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSaveLocation}>
                  <DialogHeader>
                    <DialogTitle>Añadir Nueva Ubicación</DialogTitle>
                    <DialogDescription>
                      Completa los detalles de la nueva ubicación de trabajo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nombre</Label>
                      <Input id="name" placeholder="Ej: Edificio B" className="col-span-3" value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="campus" className="text-right">Campus</Label>
                      <Input id="campus" placeholder="Ej: Campus Principal" className="col-span-3" value={newLocation.campus} onChange={(e) => setNewLocation({...newLocation, campus: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">Dirección</Label>
                      <Input id="address" placeholder="Ej: Av. Universidad 127" className="col-span-3" value={newLocation.address} onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Ubicación</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell>{loc.campus}</TableCell>
                  <TableCell>{loc.address}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
