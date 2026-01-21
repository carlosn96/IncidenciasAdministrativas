'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User as FirebaseUser, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, provider, isFirebaseConfigured } from '@/lib/firebase';
import type { Location, Period, Schedule, UserProfile } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

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

const ALLOWED_DOMAIN = "universidad-une.com";
const DEV_MODE_USER_ID = process.env.NEXT_PUBLIC_DEV_MODE_USER_ID;

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
const getInitialUserProfile = (): UserProfile => ({ academicBackground: '', coordinatedCourses: '' });


interface AuthError {
  title: string;
  message: string;
}

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
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  // Auth related
  authError: AuthError | null;
  isSigningIn: boolean;
  handleGoogleSignIn: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getInitialUserProfile());
  
  const fetchUserData = useCallback(async (userId: string) => {
      if (!db) {
        console.error("Firestore DB is not configured. Cannot fetch user data.");
        return;
      }
      const userDocRef = doc(db, 'users', userId);
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
          setUserProfile(data.userProfile || getInitialUserProfile());
        } else {
          console.log(`Creating new user document for ${userId}`);
          const initialSchedules = getInitialSchedules();
          const initialActiveScheduleId = initialSchedules.length > 0 ? initialSchedules[0].id : null;
          
          setUserLocations(getInitialUserLocations());
          setSchedules(initialSchedules);
          setActiveScheduleId(initialActiveScheduleId);
          setPeriods(getInitialPeriods());
          setUserProfile(getInitialUserProfile());
          
          await setDoc(userDocRef, {
            userLocations: getInitialUserLocations(),
            schedules: initialSchedules,
            activeScheduleId: initialActiveScheduleId,
            periods: getInitialPeriods(),
            userProfile: getInitialUserProfile(),
          });
        }
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
      }
  }, []);

  const clearUserData = () => {
    setUser(null);
    setUserLocations(getInitialUserLocations());
    setSchedules(getInitialSchedules());
    setPeriods(getInitialPeriods());
    setActiveScheduleId(null);
    setUserProfile(getInitialUserProfile());
  };
    
  useEffect(() => {
    if (!isFirebaseConfigured) {
        setIsLoading(false);
        return;
    }

    if (DEV_MODE_USER_ID) {
      console.warn(`DEV MODE ACTIVE: Simulating login for user ${DEV_MODE_USER_ID}`);
      setIsLoading(true);
      setUser({
        uid: DEV_MODE_USER_ID,
        displayName: "Usuario de Desarrollo",
        email: "dev-user@example.com",
      } as FirebaseUser);

      fetchUserData(DEV_MODE_USER_ID).finally(() => setIsLoading(false));
      return; // IMPORTANT: This prevents the real auth listener from running
    }

    const unsubscribe = auth?.onAuthStateChanged(async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchUserData(firebaseUser.uid);
        } else {
          clearUserData();
        }
        setIsLoading(false);
    });
    return () => unsubscribe?.();
  }, [fetchUserData]);

  useEffect(() => {
    if (!isLoading && user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      const dataToStore = {
        userLocations,
        schedules,
        activeScheduleId,
        periods,
        userProfile,
      };
      setDoc(userDocRef, dataToStore, { merge: true }).catch((error) => {
        console.error("Failed to save data to Firestore:", error);
      });
    }
  }, [isLoading, user, userLocations, schedules, activeScheduleId, periods, userProfile]);

  const handleGoogleSignIn = async () => {
    if (!auth || !provider) return;
    
    if (DEV_MODE_USER_ID) {
      toast({
        variant: "destructive",
        title: "Modo de Desarrollo Activo",
        description: "El inicio de sesión manual está deshabilitado. La aplicación ya está usando un usuario simulado."
      });
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await signOut(auth);
        setAuthError({
          title: "Dominio no Autorizado",
          message: `El acceso está restringido a cuentas del dominio @${ALLOWED_DOMAIN}. Por favor, utiliza tu cuenta institucional.`
        });
        setIsSigningIn(false);
        return;
      }
      
      toast({
        title: `¡Bienvenido, ${result.user.displayName?.split(" ")[0]}!`,
        description: `Has iniciado sesión correctamente.`,
      });
      
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError({
          title: 'Proceso cancelado',
          message: 'El inicio de sesión fue cancelado. Por favor, inténtalo de nuevo.'
        });
      } else {
        console.error("Authentication error:", error);
        setAuthError({
          title: "Error de Autenticación",
          message: "Ocurrió un error inesperado al intentar iniciar sesión."
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

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
    userProfile,
    setUserProfile,
    authError,
    isSigningIn,
    handleGoogleSignIn,
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
