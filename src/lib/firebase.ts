
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all Firebase config variables are present.
const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
  const errorMessage = `Firebase configuration is incomplete. The following environment variables are missing: ${missingConfigKeys.join(", ")}. Please make sure all NEXT_PUBLIC_FIREBASE_* variables are set in your deployment environment.`;
  console.error(errorMessage);
  if (typeof window !== "undefined") {
    // Only throw error on client side to avoid build failures
    throw new Error(errorMessage);
  }
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Google Auth Provider
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
  hd: 'universidad-une.com', // Restrict to a specific domain if needed
});


// Try to enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn("Firestore persistence failed to enable. This can happen if multiple tabs are open.");
      } else if (err.code == 'unimplemented') {
        console.warn("Firestore persistence is not supported in this browser.");
      }
    });
}

export { app, auth, db, provider };
