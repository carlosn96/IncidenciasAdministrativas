import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LocationsSettings } from "@/components/locations-settings";
import { IncidentTypesSettings } from "@/components/incident-types-settings";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">
          Manage application configurations and parameters.
        </p>
      </div>

      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="incident-types">Incident Types</TabsTrigger>
        </TabsList>
        <TabsContent value="locations">
            <LocationsSettings />
        </TabsContent>
        <TabsContent value="incident-types">
            <IncidentTypesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
