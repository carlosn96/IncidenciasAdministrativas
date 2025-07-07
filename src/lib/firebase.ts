
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

const missingConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let provider: GoogleAuthProvider | null = null;

// Only initialize Firebase if all config keys are present.
if (missingConfigKeys.length === 0) {
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
} else if (process.env.NEXT_PUBLIC_NO_AUTH_MODE !== 'true') {
    // If NOT in NO_AUTH_MODE and keys are missing, throw the error.
    const errorMessage = `Firebase configuration is incomplete. The following environment variables are missing in your .env file:
  - ${missingConfigKeys.join("\n  - ")}

To fix this, please:
1. Open the .env file in the root of your project.
2. Go to your Firebase project console -> Project Settings -> General.
3. Find your Web App configuration and copy the credential values.
4. Paste them into the corresponding NEXT_PUBLIC_FIREBASE_* variables in the .env file.

The application cannot run without these keys to connect to your database.`;
  
  throw new Error(errorMessage);
}
// If in NO_AUTH_MODE and keys are missing, we do nothing and the services remain null.

export { app, auth, db, provider };
