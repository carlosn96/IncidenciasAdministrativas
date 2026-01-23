'use server';
/**
 * @fileOverview Server actions for the application.
 * This file is reserved for server-side logic that can be called from client components.
 */

import { google } from "googleapis";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : 'http://localhost:9002/api/auth/google/callback'
);

export async function getGoogleAuthUrl(userId: string) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: userId, // Pass the user's UID to identify them in the callback
  });

  return { url };
}

export async function disconnectGoogleAccount(userId: string) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userProfile = userData.userProfile || {};
      
      // Revoke the token with Google
      const refreshToken = userProfile.googleRefreshToken;
      if (refreshToken) {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        await oauth2Client.revokeCredentials();
      }

      // Remove the token from Firestore
      delete userProfile.googleRefreshToken;
      await setDoc(userDocRef, { userProfile }, { merge: true });
    }
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "No se pudo desconectar la cuenta." };
  }
}
