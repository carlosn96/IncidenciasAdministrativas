"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LocationsSettings } from "@/components/locations-settings";
import { SchedulesSettings } from "@/components/schedules-settings";
import { Clock, MapPin } from "lucide-react";
import type { Location } from "@/lib/types";

// Master list of all possible locations
const ALL_UNE_LOCATIONS: Location[] = [
  { id: "loc1", name: "PLANTEL CENTRO", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc2", name: "PLANTEL CENTRO MÉDICO", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc3", name: "PLANTEL MILENIO", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc4", name: "PLANTEL TESISTÁN", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc5", name: "PLANTEL TLAJOMULCO", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc6", name: "PLANTEL TLAQUEPAQUE", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc7", name: "PLANTEL TONALÁ", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc8", name: "PLANTEL TORRE QUETZAL", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc9", name: "PLANTEL TORRE UNE", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc10", name: "PLANTEL VALLARTA", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc11", name: "PLANTEL ZAPOPAN", campus: "Centro Universitario UNE", address: "N/A" },
];

// Initial personalized list for the user
const initialUserLocations: Location[] = [
  { id: "loc1", name: "PLANTEL CENTRO", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc9", name: "PLANTEL TORRE UNE", campus: "Centro Universitario UNE", address: "N/A" },
  { id: "loc11", name: "PLANTEL ZAPOPAN", campus: "Centro Universitario UNE", address: "N/A" },
];


export default function SettingsPage() {
  const [userLocations, setUserLocations] = useState<Location[]>(initialUserLocations);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona las configuraciones y parámetros de la aplicación.
        </p>
      </div>

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">
            <MapPin className="mr-2 h-4 w-4" />
            Mis Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            Horarios por Defecto
          </TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
            <LocationsSettings
              userLocations={userLocations}
              setUserLocations={setUserLocations}
              allLocations={ALL_UNE_LOCATIONS}
            />
        </TabsContent>
        <TabsContent value="schedules">
            <SchedulesSettings
              userLocations={userLocations}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
