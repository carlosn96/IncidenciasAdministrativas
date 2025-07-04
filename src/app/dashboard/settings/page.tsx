
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LocationsSettings } from "@/components/locations-settings";
import { SchedulesSettings } from "@/components/schedules-settings";
import { PeriodsList } from "@/components/periods-list";
import { Clock, MapPin, CalendarDays } from "lucide-react";
import { useSettings } from "@/context/settings-context";


export default function SettingsPage() {
  const { 
    userLocations, 
    setUserLocations, 
    allLocations, 
    schedules,
    setSchedules,
    activeScheduleId,
    setActiveScheduleId,
    periods
  } = useSettings();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab") || "locations";

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona las configuraciones y parámetros de la aplicación.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="overflow-x-auto h-auto justify-start">
          <TabsTrigger value="locations">
            <MapPin className="mr-2 h-4 w-4" />
            Mis Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="periods">
            <CalendarDays className="mr-2 h-4 w-4" />
            Periodos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
            <LocationsSettings
              userLocations={userLocations}
              setUserLocations={setUserLocations}
              allLocations={allLocations}
            />
        </TabsContent>
        <TabsContent value="schedules">
            <SchedulesSettings
              userLocations={userLocations}
              schedules={schedules}
              setSchedules={setSchedules}
              activeScheduleId={activeScheduleId}
              setActiveScheduleId={setActiveScheduleId}
            />
        </TabsContent>
        <TabsContent value="periods">
            <PeriodsList
              periods={periods}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
