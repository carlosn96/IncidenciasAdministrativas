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

// Default initial data for a NEW user
const getInitialUserLocations = (): Location[] => [];

const getInitialScheduleData = (): ScheduleEntry[] => [
  { day: "Lunes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Martes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Miércoles", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Jueves", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Viernes", startTime: "", endTime: "", startLocation: "", endLocation: "" },
  { day: "Sábado", startTime: "", endTime: "", startLocation: "", endLocation: "" },
];

const getInitialPeriods = (): Period[] => [];


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

  // State for user-specific data
  const [userLocations, setUserLocations] = useState<Location[]>(getInitialUserLocations());
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(getInitialScheduleData());
  const [periods, setPeriods] = useState<Period[]>(getInitialPeriods());
  
  // Effect for handling authentication state changes and loading user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // User is signed in, load their data from localStorage
        const storageKey = `incidencias-data-${currentUser.uid}`;
        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                setUserLocations(parsedData.userLocations || getInitialUserLocations());
                setSchedule(parsedData.schedule || getInitialScheduleData());
                // Important: Re-hydrate date objects from strings
                const rehydratedPeriods = (parsedData.periods || []).map((p: any) => ({
                    ...p,
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                }));
                setPeriods(rehydratedPeriods || getInitialPeriods());
            } else {
                // No saved data found, use initial state
                setUserLocations(getInitialUserLocations());
                setSchedule(getInitialScheduleData());
                setPeriods(getInitialPeriods());
            }
        } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
            // If parsing fails, reset to initial state for safety
            setUserLocations(getInitialUserLocations());
            setSchedule(getInitialScheduleData());
            setPeriods(getInitialPeriods());
        }
      } else {
        // User is signed out, clear all user-specific data
        setUserLocations(getInitialUserLocations());
        setSchedule(getInitialScheduleData());
        setPeriods(getInitialPeriods());
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // This effect runs once on mount to set up the auth listener

  // Effect for saving user data to localStorage whenever it changes
  useEffect(() => {
    // We prevent saving during the initial loading phase to avoid overwriting hydrated state with initial state
    if (user && !isLoading) {
      const storageKey = `incidencias-data-${user.uid}`;
      const dataToStore = {
        userLocations,
        schedule,
        periods
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    }
  }, [userLocations, schedule, periods, user, isLoading]);


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
