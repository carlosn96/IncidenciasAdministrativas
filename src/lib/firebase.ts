
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const configValues = Object.values(firebaseConfig);
export const isFirebaseConfigured = configValues.every(Boolean);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let provider: GoogleAuthProvider | undefined;

// Initialize Firebase app and Firestore on both client and server if configured.
if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase app or Firestore:", error);
    app = undefined;
    db = undefined;
  }
}

// Initialize client-side only features (auth, provider, persistence) on the client.
if (isFirebaseConfigured && typeof window !== 'undefined') {
  try {
    if (!auth) auth = getAuth(app!);
    if (!provider) {
      provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    if (db) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore persistence failed to enable due to multiple tabs.");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore persistence is not supported in this browser.");
        }
      });
    }
  } catch (error) {
    console.error("Error initializing client-side Firebase features:", error);
    auth = undefined;
    provider = undefined;
  }
}

export { app, auth, db, provider };
