'use server';
/**
 * @fileOverview Server actions for the application.
 * This file is reserved for server-side logic that can be called from client components.
 */

import { google } from "googleapis";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { oauth2Client, REDIRECT_URI } from "./google-oauth-client";

export async function getGoogleAuthUrl(userId: string) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
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
    if (!db) {
        throw new Error("Firestore DB is not initialized.");
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userProfile = userData.userProfile || {};
      
      // Revoke the token with Google
      const refreshToken = userProfile.googleRefreshToken;
      if (refreshToken) {
        // Create a new client instance for this specific revocation action
        // to avoid race conditions with the shared module-level client.
        const userClient = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          REDIRECT_URI
        );
        userClient.setCredentials({ refresh_token: refreshToken });
        try {
            await userClient.revokeCredentials();
        } catch (revokeError) {
            console.warn("Could not revoke Google token, it might have been already invalid.", revokeError);
        }
      }

      // Atomically remove the field from the document
      await updateDoc(userDocRef, {
        'userProfile.googleRefreshToken': deleteField()
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "No se pudo desconectar la cuenta." };
  }
}
