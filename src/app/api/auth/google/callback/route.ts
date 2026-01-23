
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    : 'http://localhost:9002/api/auth/google/callback'
);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const userId = url.searchParams.get('state');

  if (!code || !userId) {
    return NextResponse.redirect(new URL('/dashboard/profile?error=auth_failed', url.origin));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.error('No refresh token received from Google.');
      return NextResponse.redirect(new URL('/dashboard/profile?error=no_refresh_token', url.origin));
    }
    
    if (!db) {
        throw new Error("Firestore DB is not initialized.");
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userProfile = userDoc.data().userProfile || {};
      userProfile.googleRefreshToken = refreshToken;
      await setDoc(userDocRef, { userProfile }, { merge: true });
    } else {
        // This case is unlikely if the user initiated the flow from the app, but handle it anyway.
        const userProfile = { googleRefreshToken: refreshToken };
        await setDoc(userDocRef, { userProfile });
    }

    return NextResponse.redirect(new URL('/dashboard/profile?success=google_connected', url.origin));
  } catch (error) {
    console.error('Error exchanging auth code for tokens:', error);
    return NextResponse.redirect(new URL('/dashboard/profile?error=token_exchange_failed', url.origin));
  }
}
