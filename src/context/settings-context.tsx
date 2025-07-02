'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Location, ScheduleEntry, Period } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

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
  { id: "loc12", name: "Coordinación Académica", campus: "Centro Universitario UNE", address: "N/A" },
];

// User-specific data will be empty initially
const initialUserLocations: Location[] = [];

const initialScheduleData: ScheduleEntry[] = [
  { day: "Lunes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Martes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Miércoles", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Jueves", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Viernes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

interface SettingsContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocations, setUserLocations] = useState<Location[]>(initialUserLocations);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialScheduleData);
  const [periods, setPeriods] = useState<Period[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const value = {
    user,
    isLoading,
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
