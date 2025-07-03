'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Location, Period, Schedule } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth'; // We keep the type for compatibility
import { v4 as uuidv4 } from 'uuid';


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

// Default initial data for a NEW user
const getInitialUserLocations = (): Location[] => [];

const getInitialSchedules = (): Schedule[] => [{
  id: uuidv4(),
  name: 'Horario Principal',
  entries: [
    { day: "Lunes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Martes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Miércoles", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Jueves", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Viernes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
    { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  ]
}];

const getInitialPeriods = (): Period[] => [];


interface SettingsContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  allLocations: Location[];
  userLocations: Location[];
  setUserLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  activeScheduleId: string | null;
  setActiveScheduleId: React.Dispatch<React.SetStateAction<string | null>>;
  periods: Period[];
  setPeriods: React.Dispatch<React.SetStateAction<Period[]>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for user-specific data
  const [userLocations, setUserLocations] = useState<Location[]>(getInitialUserLocations());
  const [schedules, setSchedules] = useState<Schedule[]>(getInitialSchedules());
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>(getInitialPeriods());
  
  // Effect for loading data from localStorage on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem('userAppData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setUserLocations(data.userLocations || getInitialUserLocations());
        
        const loadedSchedules = data.schedules || getInitialSchedules();
        setSchedules(loadedSchedules);
        
        const loadedActiveScheduleId = data.activeScheduleId || (loadedSchedules.length > 0 ? loadedSchedules[0].id : null);
        setActiveScheduleId(loadedActiveScheduleId);
        
        const rehydratedPeriods = (data.periods || []).map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
        })).sort((a: Period, b: Period) => b.startDate.getTime() - a.startDate.getTime());
        
        setPeriods(rehydratedPeriods);
      } else {
        const initialSchedules = getInitialSchedules();
        setSchedules(initialSchedules);
        setActiveScheduleId(initialSchedules.length > 0 ? initialSchedules[0].id : null);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      const initialSchedules = getInitialSchedules();
      setSchedules(initialSchedules);
      setActiveScheduleId(initialSchedules.length > 0 ? initialSchedules[0].id : null);
    }
    
    // Set a mock user since we are not authenticating
    setUser({
        uid: 'local-user',
        displayName: 'Usuario Local',
        email: 'local.user@example.com',
        photoURL: `https://placehold.co/100x100.png`,
    } as FirebaseUser);

    setIsLoading(false);
  }, []);

  // Effect for saving user data to localStorage whenever it changes
  useEffect(() => {
    // We only save if we are not in the initial loading phase.
    if (!isLoading) {
      const dataToStore = {
        userLocations,
        schedules,
        activeScheduleId,
        periods,
      };
      localStorage.setItem('userAppData', JSON.stringify(dataToStore));
    }
  }, [isLoading, userLocations, schedules, activeScheduleId, periods]);


  const value = {
    user,
    isLoading,
    allLocations: ALL_UNE_LOCATIONS,
    userLocations,
    setUserLocations,
    schedules,
    setSchedules,
    activeScheduleId,
    setActiveScheduleId,
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
