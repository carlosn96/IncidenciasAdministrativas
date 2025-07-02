
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Location, ScheduleEntry, Period } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';


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
  
  // Effect for handling authentication state changes and loading user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setIsLoading(true);
        const docRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserLocations(data.userLocations || getInitialUserLocations());
            setSchedule(data.schedule || getInitialScheduleData());
            
            // Important: Re-hydrate date objects from Firestore Timestamps
            const rehydratedPeriods = (data.periods || []).map((p: any) => ({
              ...p,
              startDate: p.startDate?.toDate ? p.startDate.toDate() : new Date(p.startDate),
              endDate: p.endDate?.toDate ? p.endDate.toDate() : new Date(p.endDate),
            })).sort((a: Period, b: Period) => b.startDate.getTime() - a.startDate.getTime());
            
            setPeriods(rehydratedPeriods || getInitialPeriods());
          } else {
            // New user, use initial state. Data will be saved on first change.
            setUserLocations(getInitialUserLocations());
            setSchedule(getInitialScheduleData());
            setPeriods(getInitialPeriods());
          }
        } catch (e) {
          console.error("Failed to fetch user data from Firestore", e);
          // Fallback to initial state in case of error
          setUserLocations(getInitialUserLocations());
          setSchedule(getInitialScheduleData());
          setPeriods(getInitialPeriods());
        } finally {
          setIsLoading(false);
        }
      } else {
        // User is signed out, clear all user-specific data
        setUserLocations(getInitialUserLocations());
        setSchedule(getInitialScheduleData());
        setPeriods(getInitialPeriods());
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Runs once on mount

  // Effect for saving user data to Firestore whenever it changes
  useEffect(() => {
    // We only save if there's a user and we are not in the initial loading phase.
    if (user && !isLoading) {
      const saveData = async () => {
        const docRef = doc(db, "users", user.uid);
        const dataToStore = {
          userLocations,
          schedule,
          periods // Firestore handles JS Date to Timestamp conversion automatically
        };
        try {
          await setDoc(docRef, dataToStore);
        } catch (error) {
          console.error("Error saving data to Firestore:", error);
        }
      };
      saveData();
    }
  }, [user, isLoading, userLocations, schedule, periods]);


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
