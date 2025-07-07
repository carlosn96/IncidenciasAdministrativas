
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

// Check for missing configuration keys.
const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let provider: GoogleAuthProvider | undefined;

// Initialize Firebase only if all keys are present.
if (missingConfigKeys.length === 0) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    // We only try to enable persistence on the client-side.
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn("Firestore persistence failed to enable. This can happen if multiple tabs are open.");
          } else if (err.code === 'unimplemented') {
            console.warn("Firestore persistence is not supported in this browser.");
          }
        });
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // If initialization fails, ensure all exports are undefined
    app = undefined;
    auth = undefined;
    db = undefined;
    provider = undefined;
  }
} else {
  // If keys are missing, log a warning for developers.
  // This will be visible in the server console during development.
  if (process.env.NODE_ENV === 'development') {
    console.warn(`
********************************************************************************
Firebase configuration is INCOMPLETE.
The application will run, but authentication and database features are disabled.
Please add your Firebase project credentials to the .env file to enable them.
Missing keys: ${missingConfigKeys.join(", ")}
********************************************************************************
    `);
  }
}

export { app, auth, db, provider };
