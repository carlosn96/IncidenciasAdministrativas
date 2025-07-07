
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
  isFirebaseConfigured: boolean;
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
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(!!auth && !!db);

  // State for user-specific data
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  
  // Effect for handling auth and data loading
  useEffect(() => {
    // If Firebase is not configured, we don't need to do anything else.
    // The UI will show a message based on `isFirebaseConfigured`.
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const loadInitialLocalData = () => {
        const initialSchedules = getInitialSchedules();
        setUserLocations(getInitialUserLocations());
        setSchedules(initialSchedules);
        setActiveScheduleId(initialSchedules.length > 0 ? initialSchedules[0].id : null);
        setPeriods(getInitialPeriods());
    }

    const fetchUserData = async (userId: string) => {
        const userDocRef = doc(db!, 'users', userId);
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
            console.log(`Creating new user document for ${userId}`);
            const initialSchedules = getInitialSchedules();
            const initialActiveScheduleId = initialSchedules.length > 0 ? initialSchedules[0].id : null;
            loadInitialLocalData(); // Loads local data into state
            
            // And saves it to Firestore for the new user
            await setDoc(userDocRef, {
              userLocations: getInitialUserLocations(),
              schedules: initialSchedules,
              activeScheduleId: initialActiveScheduleId,
              periods: getInitialPeriods(),
            });
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          loadInitialLocalData(); // Fallback to local data on firestore error
        }
    };
    
    // auth is guaranteed to be defined here because of the `isFirebaseConfigured` check.
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserData(firebaseUser.uid);
      } else {
        setUser(null);
        // Clear all user data when logged out
        loadInitialLocalData();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  // Effect for saving user data to Firestore whenever it changes
  useEffect(() => {
    // Avoid writing if firebase isn't set up, not loading, and user is present
    if (isFirebaseConfigured && !isLoading && user) {
      const userDocRef = doc(db!, 'users', user.uid);
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
  }, [isFirebaseConfigured, isLoading, user, userLocations, schedules, activeScheduleId, periods]);


  const value = {
    user,
    isLoading,
    isFirebaseConfigured,
    allLocations: ALL_UNE_LOCATIONS,
    userLocations,
    setUserLocations,
    schedules,
    setSchedules,
    activeScheduleId,
    setActiveScheduleId,
    periods,
    setPeriods,
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
