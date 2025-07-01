"use client";

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
import { useToast } from "@/hooks/use-toast";
import type { ScheduleEntry } from "@/lib/types";

const scheduleData: ScheduleEntry[] = [
  { day: "Monday", startTime: "09:00 AM", endTime: "05:00 PM", location: "Main Campus" },
  { day: "Tuesday", startTime: "09:00 AM", endTime: "05:00 PM", location: "Main Campus" },
  { day: "Wednesday", startTime: "09:00 AM", endTime: "01:00 PM", location: "North Campus" },
  { day: "Thursday", startTime: "09:00 AM", endTime: "05:00 PM", location: "Main Campus" },
  { day: "Friday", startTime: "09:00 AM", endTime: "03:00 PM", location: "Remote" },
];

export default function SchedulesPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would handle form submission here
        toast({
            title: "Schedule Updated",
            description: "Your default schedule has been saved.",
        });
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Default Schedules</h1>
        <p className="text-muted-foreground">
          Manage your default work hours and locations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            This is your default weekly work schedule. It can be overridden by specific incidents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleData.map((entry) => (
                  <TableRow key={entry.day}>
                    <TableCell className="font-medium">{entry.day}</TableCell>
                    <TableCell>{entry.startTime}</TableCell>
                    <TableCell>{entry.endTime}</TableCell>
                    <TableCell>{entry.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Edit Schedule</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Default Schedule</DialogTitle>
                  <DialogDescription>
                    Make changes to your weekly schedule here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Example for one day. A real app would map over days. */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="monday-start" className="text-right">Monday</Label>
                            <Input id="monday-start" type="time" defaultValue="09:00" className="col-span-1" />
                            <Input id="monday-end" type="time" defaultValue="17:00" className="col-span-1" />
                            <Input id="monday-location" defaultValue="Main Campus" className="col-span-1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
