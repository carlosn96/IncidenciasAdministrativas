'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Location, ScheduleEntry, Period } from '@/lib/types';

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

const initialScheduleData: ScheduleEntry[] = [
  { day: "Lunes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Martes", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Miércoles", startTime: "09:00", endTime: "13:00", startLocation: "PLANTEL TORRE UNE", endLocation: "PLANTEL TORRE UNE" },
  { day: "Jueves", startTime: "09:00", endTime: "17:00", startLocation: "PLANTEL CENTRO", endLocation: "PLANTEL CENTRO" },
  { day: "Viernes", startTime: "09:00", endTime: "15:00", startLocation: "PLANTEL ZAPOPAN", endLocation: "PLANTEL ZAPOPAN" },
  { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

interface SettingsContextType {
  allLocations: Location[];
  userLocations: Location[];
  setUserLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  schedule: ScheduleEntry[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleEntry[]>>;
  periods: Period[];
  setPeriods: React.Dispatch<React.SetStateAction<Period[]>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [userLocations, setUserLocations] = useState<Location[]>(initialUserLocations);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
  const [periods, setPeriods] = useState<Period[]>([]);

  const value = {
    allLocations: ALL_UNE_LOCATIONS,
    userLocations,
    setUserLocations,
    schedule,
    setSchedule,
    periods,
    setPeriods
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
