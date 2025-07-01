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
  { id: "loc1", name: "Building A", campus: "Main Campus", address: "123 University Ave" },
  { id: "loc2", name: "Library", campus: "Main Campus", address: "125 University Ave" },
  { id: "loc3", name: "Science Hub", campus: "North Campus", address: "456 College Rd" },
  { id: "loc4", name: "Home Office", campus: "Remote", address: "N/A" },
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
            title: "Validation Error",
            description: "Location Name and Campus are required.",
        });
        return;
    }

    const newLoc: Location = {
        id: `loc${locations.length + 1}`,
        ...newLocation,
    };

    setLocations(prev => [newLoc, ...prev]);
    toast({
        title: "Location Added",
        description: `Successfully added '${newLocation.name}'.`,
    });

    setNewLocation({ name: "", campus: "", address: "" });
    setIsDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Location Configuration</CardTitle>
                <CardDescription>
                    Define work locations and campuses for clock-in systems.
                </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Location</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSaveLocation}>
                  <DialogHeader>
                    <DialogTitle>Add New Location</DialogTitle>
                    <DialogDescription>
                      Fill in the details for the new work location.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" placeholder="e.g., Building B" className="col-span-3" value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="campus" className="text-right">Campus</Label>
                      <Input id="campus" placeholder="e.g., Main Campus" className="col-span-3" value={newLocation.campus} onChange={(e) => setNewLocation({...newLocation, campus: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">Address</Label>
                      <Input id="address" placeholder="e.g., 127 University Ave" className="col-span-3" value={newLocation.address} onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Location</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell>{loc.campus}</TableCell>
                  <TableCell>{loc.address}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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
