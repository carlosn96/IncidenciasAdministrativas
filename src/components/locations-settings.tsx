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
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationData, setLocationData] = useState({ name: "", campus: "", address: "" });
  const { toast } = useToast();

  const handleAddClick = () => {
    setEditingLocation(null);
    setLocationData({ name: "", campus: "", address: "" });
    setIsDialogOpen(true);
  };

  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setLocationData({ name: location.name, campus: location.campus, address: location.address });
    setIsDialogOpen(true);
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationData.name.trim() || !locationData.campus.trim()) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "El nombre de la ubicación y el campus son requeridos.",
        });
        return;
    }

    if (editingLocation) {
        setLocations(locations.map(loc => 
            loc.id === editingLocation.id ? { ...editingLocation, ...locationData } : loc
        ));
        toast({
            title: "Ubicación Actualizada",
            description: `Se ha actualizado '${locationData.name}' exitosamente.`,
        });
    } else {
        const newLoc: Location = {
            id: `loc${Date.now()}`,
            ...locationData,
        };
        setLocations(prev => [newLoc, ...prev]);
        toast({
            title: "Ubicación Añadida",
            description: `Se ha añadido '${locationData.name}' exitosamente.`,
        });
    }

    setIsDialogOpen(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle>Configuración de Ubicaciones</CardTitle>
                  <CardDescription>
                      Define ubicaciones de trabajo y campus para los sistemas de registro.
                  </CardDescription>
              </div>
              <Button onClick={handleAddClick}>Añadir Ubicación</Button>
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
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(loc)}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveLocation}>
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Editar Ubicación' : 'Añadir Nueva Ubicación'}</DialogTitle>
              <DialogDescription>
                {editingLocation 
                  ? "Realiza cambios a los detalles de la ubicación."
                  : "Completa los detalles de la nueva ubicación de trabajo."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" placeholder="Ej: Edificio B" className="col-span-3" value={locationData.name} onChange={(e) => setLocationData({...locationData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="campus" className="text-right">Campus</Label>
                <Input id="campus" placeholder="Ej: Campus Principal" className="col-span-3" value={locationData.campus} onChange={(e) => setLocationData({...locationData, campus: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">Dirección</Label>
                <Input id="address" placeholder="Ej: Av. Universidad 127" className="col-span-3" value={locationData.address} onChange={(e) => setLocationData({...locationData, address: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingLocation ? 'Guardar Cambios' : 'Guardar Ubicación'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
