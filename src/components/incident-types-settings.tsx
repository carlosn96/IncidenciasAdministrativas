"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createIncidentTypeAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { IncidentType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialIncidentTypes: IncidentType[] = [
    { id: "inc1", name: "Medical Leave", requiredDocumentation: "Doctor's Note, Leave Application Form" },
    { id: "inc2", name: "Hardware Failure", requiredDocumentation: "IT Support Ticket, Photo of damage" },
];


export function IncidentTypesSettings() {
  const [description, setDescription] = useState("");
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>(initialIncidentTypes);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please provide a description for the incident type.",
        });
        return;
    }

    startTransition(async () => {
      const result = await createIncidentTypeAction(description);
      if (result.success) {
        toast({
          title: "Incident Type Generated",
          description: `Successfully created '${result.data.incidentType}'.`,
        });
        const newType: IncidentType = {
            id: `inc${incidentTypes.length + 1}`,
            name: result.data.incidentType,
            requiredDocumentation: result.data.requiredDocumentation,
        };
        setIncidentTypes(prev => [newType, ...prev]);
        setDescription("");
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Generate New Incident Type</CardTitle>
        <CardDescription>
          Describe an incident, and AI will create a structured type and suggest required documentation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Incident Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., 'A coordinator needs to take time off due to a family emergency.'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Existing Incident Types</CardTitle>
            <CardDescription>
                List of currently configured incident types.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type Name</TableHead>
                            <TableHead>Required Documentation</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {incidentTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell className="font-medium">{type.name}</TableCell>
                                <TableCell>{type.requiredDocumentation}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
    </div>
  );
}
