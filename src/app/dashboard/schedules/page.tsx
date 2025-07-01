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
import { useToast } from "@/hooks/use-toast";
import type { ScheduleEntry } from "@/lib/types";

const initialScheduleData: ScheduleEntry[] = [
  { day: "Monday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Tuesday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Wednesday", startTime: "09:00", endTime: "13:00", location: "North Campus" },
  { day: "Thursday", startTime: "09:00", endTime: "17:00", location: "Main Campus" },
  { day: "Friday", startTime: "09:00", endTime: "15:00", location: "Remote" },
];

export default function SchedulesPage() {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
    const [editableSchedule, setEditableSchedule] = useState<ScheduleEntry[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenDialog = () => {
        setEditableSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy to avoid mutating original state
        setIsDialogOpen(true);
    };

    const handleScheduleChange = (index: number, field: keyof Omit<ScheduleEntry, 'day'>, value: string) => {
        const updatedSchedule = [...editableSchedule];
        updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
        setEditableSchedule(updatedSchedule);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSchedule(editableSchedule);
        toast({
            title: "Schedule Updated",
            description: "Your default schedule has been saved.",
        });
        setIsDialogOpen(false);
    }
    
    const formatTime12h = (timeStr: string) => {
        if (!timeStr) return "---";
        const [hours, minutes] = timeStr.split(":");
        if (isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) return timeStr; // Return original if not valid time format
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        return `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

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
                {schedule.map((entry) => (
                  <TableRow key={entry.day}>
                    <TableCell className="font-medium">{entry.day}</TableCell>
                    <TableCell>{formatTime12h(entry.startTime)}</TableCell>
                    <TableCell>{formatTime12h(entry.endTime)}</TableCell>
                    <TableCell>{entry.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>Edit Schedule</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                    <DialogTitle>Edit Default Schedule</DialogTitle>
                    <DialogDescription>
                        Make changes to your weekly schedule here. Click save when you're done.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4 px-1 text-sm font-medium">
                            <Label>Day</Label>
                            <Label>Start Time</Label>
                            <Label>End Time</Label>
                            <Label>Location</Label>
                        </div>
                        <div className="space-y-2">
                        {editableSchedule.map((entry, index) => (
                            <div key={entry.day} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`${entry.day}-day`} className="font-medium">{entry.day}</Label>
                                <Input id={`${entry.day}-start`} type="time" value={entry.startTime} onChange={e => handleScheduleChange(index, 'startTime', e.target.value)} />
                                <Input id={`${entry.day}-end`} type="time" value={entry.endTime} onChange={e => handleScheduleChange(index, 'endTime', e.target.value)} />
                                <Input id={`${entry.day}-location`} value={entry.location} onChange={e => handleScheduleChange(index, 'location', e.target.value)} />
                            </div>
                        ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
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
