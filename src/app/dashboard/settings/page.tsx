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
    allLocations, 
    periods
  } = useSettings();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Ensure tab is one of the allowed values to prevent errors
  const currentTab = searchParams.get("tab");
  const tab = ["locations", "schedules", "periods"].includes(currentTab || "") ? currentTab : "locations";

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold font-headline">Configuración</h1>
                <p className="text-muted-foreground">
                  Gestiona tus ubicaciones, horarios y periodos.
                </p>
            </div>
            <div className="w-full overflow-x-auto pb-1 md:w-auto">
                <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="locations" className="flex-1 md:flex-initial">
                      <MapPin className="mr-2 h-4 w-4" />
                      Ubicaciones
                    </TabsTrigger>
                    <TabsTrigger value="schedules" className="flex-1 md:flex-initial">
                      <Clock className="mr-2 h-4 w-4" />
                      Horarios
                    </TabsTrigger>
                    <TabsTrigger value="periods" className="flex-1 md:flex-initial">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Periodos
                    </TabsTrigger>
                </TabsList>
            </div>
        </div>

        <TabsContent value="locations">
            <LocationsSettings
              allLocations={allLocations}
            />
        </TabsContent>
        <TabsContent value="schedules">
            <SchedulesSettings />
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
