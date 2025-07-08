
'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User as FirebaseUser, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, provider, isFirebaseConfigured } from '@/lib/firebase';
import type { Location, Period, Schedule } from '@/lib/types';
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
  // Auth related
  accessToken: string | null;
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

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  
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
        } else {
          console.log(`Creating new user document for ${userId}`);
          const initialSchedules = getInitialSchedules();
          const initialActiveScheduleId = initialSchedules.length > 0 ? initialSchedules[0].id : null;
          
          setUserLocations(getInitialUserLocations());
          setSchedules(initialSchedules);
          setActiveScheduleId(initialActiveScheduleId);
          setPeriods(getInitialPeriods());
          
          await setDoc(userDocRef, {
            userLocations: getInitialUserLocations(),
            schedules: initialSchedules,
            activeScheduleId: initialActiveScheduleId,
            periods: getInitialPeriods(),
          });
        }
      } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
      }
  }, []);

  const clearUserData = () => {
    setUser(null);
    setAccessToken(null);
    setUserLocations(getInitialUserLocations());
    setSchedules(getInitialSchedules());
    setPeriods(getInitialPeriods());
    setActiveScheduleId(null);
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('google_access_token');
    }
  };
    
  useEffect(() => {
    if (!isFirebaseConfigured) {
        setIsLoading(false);
        return;
    }

    // If in dev mode, bypass Firebase Auth and simulate user
    if (DEV_MODE_USER_ID) {
      console.warn(`DEV MODE ACTIVE: Simulating login for user ${DEV_MODE_USER_ID}`);
      setIsLoading(true);
      setUser({
        uid: DEV_MODE_USER_ID,
        displayName: "Usuario de Prueba",
        email: `dev-user@${ALLOWED_DOMAIN}`,
      } as FirebaseUser);
      setAccessToken(null); // No real access token in dev mode
      fetchUserData(DEV_MODE_USER_ID).finally(() => setIsLoading(false));
      return; // Skip the real auth listener
    }

    const unsubscribe = auth?.onAuthStateChanged(async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          const storedToken = sessionStorage.getItem('google_access_token');
          if (storedToken) {
              setAccessToken(storedToken);
          }
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
      };
      setDoc(userDocRef, dataToStore, { merge: true }).catch((error) => {
        console.error("Failed to save data to Firestore:", error);
      });
    }
  }, [isLoading, user, userLocations, schedules, activeScheduleId, periods]);

  const handleGoogleSignIn = async () => {
    if (!auth || !provider) return;
    if (DEV_MODE_USER_ID) {
      console.warn("Google Sign-In is disabled in DEV MODE.");
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

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        sessionStorage.setItem('google_access_token', credential.accessToken);
      } else {
        setAuthError({ title: 'Error de Token', message: 'No se pudo obtener el token de acceso de Google Calendar.' });
      }
      
      toast({
        title: `¡Bienvenido, ${result.user.displayName?.split(" ")[0]}!`,
        description: `Has iniciado sesión correctamente.`,
      });
      // The onAuthStateChanged listener will handle the user state and data fetching.
      
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
    accessToken,
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
