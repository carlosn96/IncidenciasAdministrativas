
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { oauth2Client } from '@/lib/google-oauth-client';

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
    
    // db is now initialized on the server side
    const userDocRef = doc(db!, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      await updateDoc(userDocRef, {
        'userProfile.googleRefreshToken': refreshToken,
      });
    } else {
        // This case is unlikely if the user initiated the flow from the app, but handle it anyway.
        await setDoc(userDocRef, { 
            userProfile: { googleRefreshToken: refreshToken }
        });
    }

    return NextResponse.redirect(new URL('/dashboard/profile?success=google_connected', url.origin));
  } catch (error) {
    console.error('Error exchanging auth code for tokens:', error);
    return NextResponse.redirect(new URL('/dashboard/profile?error=token_exchange_failed', url.origin));
  }
}
