"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { Incident, ScheduleEntry } from "@/lib/types";
import { Clock, Play, Square, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { format, isWithinInterval, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useSettings } from "@/context/settings-context";

export function DailyLog() {
  const { periods, setPeriods, userLocations, schedule } = useSettings();
  const [currentTime, setCurrentTime] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const { toast } = useToast();

  const { activePeriod, todayLaborDay } = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    const activePeriod = periods.find(p => isWithinInterval(today, { start: p.startDate, end: p.endDate }));
    const todayLaborDay = activePeriod?.laborDays.find(ld => ld.date === todayStr);
    
    return { activePeriod, todayLaborDay };
  }, [periods]);

  const hasEntrada = !!todayLaborDay?.entry;
  const hasSalida = !!todayLaborDay?.exit;

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

    const todaySchedule = schedule.find(s => s.day === todaySpanish);
    
    const nextEventType = hasEntrada ? 'Salida' : 'Entrada';

    if (todaySchedule) {
      if (nextEventType === 'Entrada') {
        setSelectedLocation(todaySchedule.startLocation || "");
      } else { // nextEventType is 'Salida'
        setSelectedLocation(todaySchedule.endLocation || "");
      }
    } else {
      setSelectedLocation("");
    }
  }, [hasEntrada, schedule]);

  const handleRegisterEvent = (type: 'Entrada' | 'Salida') => {
    if (!selectedLocation) {
      toast({
        variant: "destructive",
        title: "Ubicación Requerida",
        description: "Por favor, selecciona una ubicación antes de registrar.",
      });
      return;
    }

     if (!activePeriod || !todayLaborDay) {
      toast({
        variant: "destructive",
        title: "Periodo no encontrado",
        description: "No hay un periodo activo o día laboral configurado para hoy.",
      });
      return;
    }

    const now = new Date();
    const newIncident: Incident = {
      time: format(now, "HH:mm"),
      location: selectedLocation,
    };
    
    const updatedPeriods = periods.map(p => {
      if (p.id === activePeriod.id) {
        const updatedLaborDays = p.laborDays.map(ld => {
          if (ld.date === todayLaborDay.date) {
            return { ...ld, [type.toLowerCase()]: newIncident };
          }
          return ld;
        });
        return { ...p, laborDays: updatedLaborDays };
      }
      return p;
    });

    setPeriods(updatedPeriods);

    toast({
      title: `${type} Registrada`,
      description: `Has registrado tu ${type.toLowerCase()} en ${selectedLocation} a las ${format(now, 'p', { locale: es })}.`,
    });
  };

  const eventsForTable: ({id: string, type: 'Entrada' | 'Salida'} & Incident)[] = [];
  if (todayLaborDay?.entry) {
    eventsForTable.push({ id: 'entrada-today', type: 'Entrada', ...todayLaborDay.entry });
  }
  if (todayLaborDay?.exit) {
    eventsForTable.push({ id: 'salida-today', type: 'Salida', ...todayLaborDay.exit });
  }

  const formatTime12h = (timeStr?: string): string => {
    if (!timeStr) return "---";
    try {
      const time = parse(timeStr, "HH:mm", new Date());
      return format(time, "p", { locale: es });
    } catch (error) {
      return "---";
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro Diario</CardTitle>
        <CardDescription>Registra tus eventos de entrada y salida del día.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1">
            <Card className="flex flex-col justify-center items-center text-center p-6 h-full bg-muted/30">
              <p className="text-sm text-muted-foreground">Hora Actual</p>
              <p className="text-5xl font-bold font-mono tracking-tighter text-primary">{currentTime || "00:00:00"}</p>
              <Clock className="h-8 w-8 text-muted-foreground mt-2" />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-6 h-full flex flex-col justify-center">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="location-select" className="mb-2 block">Ubicación de registro</Label>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={hasEntrada && hasSalida}>
                            <SelectTrigger id="location-select">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Selecciona una ubicación..." />
                            </SelectTrigger>
                            <SelectContent>
                                {userLocations.map(loc => (
                                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <Button
                            size="lg"
                            onClick={() => handleRegisterEvent('Entrada')}
                            disabled={!selectedLocation || hasEntrada}
                            className="h-12 text-base"
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Registrar Entrada
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            onClick={() => handleRegisterEvent('Salida')}
                            disabled={!selectedLocation || !hasEntrada || hasSalida}
                            className="h-12 text-base"
                        >
                            <Square className="mr-2 h-5 w-5" />
                            Registrar Salida
                        </Button>
                    </div>
                </div>
            </Card>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Eventos de Hoy</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Ubicación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsForTable.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              No hay eventos registrados hoy.
                          </TableCell>
                      </TableRow>
                  ) : (
                      [...eventsForTable].reverse().map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant={event.type === 'Entrada' ? 'default' : 'secondary'}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTime12h(event.time)}</TableCell>
                          <TableCell>{event.location}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
