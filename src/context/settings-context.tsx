
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Location, Period, Schedule } from '@/lib/types';
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
  simulateLogin: (uid: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for user-specific data
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  
  const simulateLogin = async (uid: string) => {
    setIsLoading(true);

    const mockUser = {
      uid,
      displayName: 'Usuario Simulado',
      email: 'simulado@une.edu.mx',
      photoURL: `https://placehold.co/100x100.png`,
    } as FirebaseUser;

    setUser(mockUser);
    const userDocRef = doc(db, 'users', uid);

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const loadedSchedules = data.schedules || getInitialSchedules();
        const rehydratedPeriods = (data.periods || []).map((p: any) => ({
          ...p,
          startDate: p.startDate.toDate(),
          endDate: p.endDate.toDate(),
        })).sort((a: Period, b: Period) => b.startDate.getTime() - a.startDate.getTime());

        setUserLocations(data.userLocations || getInitialUserLocations());
        setSchedules(loadedSchedules);
        setActiveScheduleId(data.activeScheduleId || (loadedSchedules.length > 0 ? loadedSchedules[0].id : null));
        setPeriods(rehydratedPeriods);
      } else {
        // New user: set initial data in state and Firestore
        const initialLocations = getInitialUserLocations();
        const initialSchedules = getInitialSchedules();
        const initialPeriods = getInitialPeriods();
        const initialActiveScheduleId = initialSchedules.length > 0 ? initialSchedules[0].id : null;

        setUserLocations(initialLocations);
        setSchedules(initialSchedules);
        setActiveScheduleId(initialActiveScheduleId);
        setPeriods(initialPeriods);
        
        await setDoc(userDocRef, {
          userLocations: initialLocations,
          schedules: initialSchedules,
          activeScheduleId: initialActiveScheduleId,
          periods: initialPeriods,
        });
      }
    } catch (error) {
      console.error("Error handling user data in Firestore:", error);
      // Fallback to local initial state if firestore fails
      setUserLocations(getInitialUserLocations());
      const initialSchedules = getInitialSchedules();
      setSchedules(initialSchedules);
      setActiveScheduleId(initialSchedules.length > 0 ? initialSchedules[0].id : null);
      setPeriods(getInitialPeriods());
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect for handling Firebase auth state change
  useEffect(() => {
    // Real auth is disabled for simulation. The app will start in a logged-out state.
    setIsLoading(false);
  }, []);

  // Effect for saving user data to Firestore whenever it changes
  useEffect(() => {
    // Avoid writing initial empty state or during loading.
    if (!isLoading && user) {
      const userDocRef = doc(db, 'users', user.uid);
      const dataToStore = {
        userLocations,
        schedules,
        activeScheduleId,
        periods, // JS Date objects are automatically converted to Firestore Timestamps
      };
      setDoc(userDocRef, dataToStore, { merge: true }).catch((error) => {
        console.error("Failed to save data to Firestore:", error);
      });
    }
  }, [isLoading, user, userLocations, schedules, activeScheduleId, periods]);


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
    setPeriods,
    simulateLogin,
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
