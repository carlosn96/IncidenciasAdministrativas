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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LaborEvent, Location, ScheduleEntry } from "@/lib/types";
import { Clock, Play, Square, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// This list would ideally be fetched or passed as a prop based on user settings
const userLocations: Location[] = [
    { id: "loc1", name: "PLANTEL CENTRO", campus: "Centro Universitario UNE", address: "N/A" },
    { id: "loc9", name: "PLANTEL TORRE UNE", campus: "Centro Universitario UNE", address: "N/A" },
    { id: "loc11", name: "PLANTEL ZAPOPAN", campus: "Centro Universitario UNE", address: "N/A" },
];

const scheduleData: ScheduleEntry[] = [
  { day: "Lunes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Martes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Miércoles", startTime: "09:00", endTime: "13:00", startLocation: "PLANTEL TORRE UNE", endLocation: "PLANTEL TORRE UNE" },
  { day: "Jueves", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Viernes", startTime: "09:00", endTime: "15:00", startLocation: "PLANTEL ZAPOPAN", endLocation: "PLANTEL ZAPOPAN" },
  { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

const initialEvents: LaborEvent[] = [
  {
    id: "evt1",
    date: "2023-10-27",
    time: "09:02 AM",
    location: "PLANTEL CENTRO",
    type: "Entrada",
  },
  {
    id: "evt2",
    date: "2023-10-27",
    time: "01:15 PM",
    location: "PLANTEL CENTRO",
    type: "Salida",
  },
  {
    id: "evt3",
    date: "2023-10-27",
    time: "02:30 PM",
    location: "PLANTEL TORRE UNE",
    type: "Entrada",
  },
];

export function DailyLog() {
  const [currentTime, setCurrentTime] = useState("");
  const [events, setEvents] = useState<LaborEvent[]>(initialEvents);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const dayIndex = new Date().getDay();
    const todaySpanish = daysOfWeek[dayIndex] as ScheduleEntry['day'];

    const todaySchedule = scheduleData.find(s => s.day === todaySpanish);
    const lastEventType = events.length > 0 ? events[events.length - 1].type : 'Salida';
    const nextEventType = lastEventType === 'Salida' ? 'Entrada' : 'Salida';

    if (todaySchedule) {
      if (nextEventType === 'Entrada') {
        setSelectedLocation(todaySchedule.startLocation || "");
      } else { // nextEventType is 'Salida'
        setSelectedLocation(todaySchedule.endLocation || "");
      }
    } else {
      setSelectedLocation("");
    }
  }, [events]);

  const handleRegisterEvent = (type: 'Entrada' | 'Salida') => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Ubicación Requerida",
        description: "Por favor, selecciona una ubicación antes de registrar.",
      });
      return;
    }

    const newEvent: LaborEvent = {
      id: `evt${events.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      location: selectedLocation,
      type: type,
    };

    setEvents(prev => [...prev, newEvent]);
    toast({
      title: `${type} Registrada`,
      description: `Has registrado tu ${type.toLowerCase()} en ${selectedLocation} a las ${newEvent.time}.`,
    });
  };

  const lastEventType = events.length > 0 ? events[events.length - 1].type : 'Salida';

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
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
             <div className="w-full sm:w-[240px]">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecciona ubicación..." />
                    </SelectTrigger>
                    <SelectContent>
                        {userLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2 w-full">
                <Button onClick={() => handleRegisterEvent('Entrada')} disabled={!selectedLocation || lastEventType === 'Entrada'} className="flex-1 sm:w-40">
                  <Play className="mr-2" />
                  Registrar Entrada
                </Button>
                <Button onClick={() => handleRegisterEvent('Salida')} disabled={!selectedLocation || lastEventType === 'Salida'} variant="destructive" className="flex-1 sm:w-40">
                  <Square className="mr-2" />
                  Registrar Salida
                </Button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Eventos de Hoy</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay eventos registrados hoy.
                        </TableCell>
                    </TableRow>
                ) : (
                    [...events].reverse().map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Badge variant={event.type === 'Entrada' ? 'default' : 'secondary'}>
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.time}</TableCell>
                        <TableCell>{event.location}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
