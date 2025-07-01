"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LaborEvent } from "@/lib/types";
import { Clock, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialEvents: LaborEvent[] = [
  {
    id: "evt1",
    date: "2023-10-27",
    clockInTime: "09:02 AM",
    clockOutTime: "01:15 PM",
    location: "Campus Principal",
    status: "Completado",
  },
  {
    id: "evt2",
    date: "2023-10-27",
    clockInTime: "02:30 PM",
    clockOutTime: null,
    location: "Campus Principal",
    status: "En Progreso",
  },
];

export function DailyLog() {
  const [currentTime, setCurrentTime] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [events, setEvents] = useState<LaborEvent[]>(initialEvents);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    setIsClockedIn(true);
    const newEvent: LaborEvent = {
        id: `evt${events.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        clockInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        clockOutTime: null,
        location: 'Campus Principal',
        status: 'En Progreso'
    };
    setEvents(prev => [...prev.filter(e => e.status !== 'En Progreso'), newEvent]);
    toast({ title: "Entrada Registrada", description: `Has registrado tu entrada exitosamente a las ${newEvent.clockInTime}.` });
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    const clockOutTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setEvents(prev => prev.map(e => e.status === 'En Progreso' ? { ...e, status: 'Completado', clockOutTime } : e));
    toast({ title: "Salida Registrada", description: `Has registrado tu salida exitosamente a las ${clockOutTime}.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro Diario</CardTitle>
        <CardDescription>Registra tus eventos de entrada y salida del día.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Hora Actual</p>
              <p className="text-2xl font-semibold font-mono">{currentTime}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleClockIn} disabled={isClockedIn} className="w-40">
              <Play className="mr-2" />
              Registrar Entrada
            </Button>
            <Button onClick={handleClockOut} disabled={!isClockedIn} variant="destructive" className="w-40">
              <Square className="mr-2" />
              Registrar Salida
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Eventos de Hoy</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.clockInTime}</TableCell>
                    <TableCell>{event.clockOutTime ?? "---"}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'Completado' ? 'secondary' : 'default'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
