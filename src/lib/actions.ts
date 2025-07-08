
'use server';
/**
 * @fileOverview Manages Google Calendar events using a Service Account.
 *
 * - manageCalendarEvent - A function to create, update, or delete Google Calendar events.
 * - CalendarEventInput - The input type for the manageCalendarEvent function.
 * - CalendarEventOutput - The return type for the manageCalendarEvent function.
 */

import { google } from 'googleapis';

// Use TypeScript types instead of Zod schemas for server actions
export type CalendarEventInput = {
  action: 'create' | 'update' | 'delete';
  calendarId: string; // The email of the target calendar
  eventId?: string;
  summary?: string;
  location?: string;
  start?: string; // ISO 8601 datetime string
  end?: string; // ISO 8601 datetime string
};

export type CalendarEventOutput = {
  success: boolean;
  eventId?: string;
  error?: string;
};


export async function manageCalendarEvent(input: CalendarEventInput): Promise<CalendarEventOutput> {
    const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY
    } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'Google Service Account credentials are not configured in .env';
        console.error(`[Calendar Action Error] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }
     if (!input.calendarId) {
        const errorMsg = 'Calendar ID (user email) is required to sync events.';
        console.error(`[Calendar Action Error] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }

    try {
        console.log('[Calendar Action] Received input:', JSON.stringify(input, null, 2));

        // Use the object-based constructor for the JWT client to specify the subject.
        // This tells Google we are acting ON BEHALF of the user specified in `input.calendarId`.
        // This is the correct way to handle cross-account access where a calendar has been
        // shared with the service account.
        const jwtClient = new google.auth.JWT({
            email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
            subject: input.calendarId, // Impersonate the user to act on their calendar
        });
        
        await jwtClient.authorize();
        
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });
        const { action, eventId, calendarId, ...eventData } = input;
        
        if (action === 'create') {
            if (!eventData.summary || !eventData.start || !eventData.end) {
              throw new Error('Missing required fields for creating an event.');
            }
            const event = {
                summary: eventData.summary,
                location: eventData.location,
                start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
                end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
            };
            const res = await calendar.events.insert({
                calendarId,
                requestBody: event,
            });
            return { success: true, eventId: res.data.id || undefined };
        } else if (action === 'update') {
            if (!eventId || !eventData.summary || !eventData.start || !eventData.end) {
                throw new Error('Missing required fields for updating an event.');
            }
            const event = {
                summary: eventData.summary,
                location: eventData.location,
                start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
                end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
            };
            const res = await calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
            });
            return { success: true, eventId: res.data.id || undefined };
        } else if (action === 'delete') {
            if (!eventId) {
                throw new Error('Missing eventId for deleting an event.');
            }
            await calendar.events.delete({ calendarId, eventId });
            return { success: true };
        } else {
            return { success: false, error: 'Invalid action specified.' };
        }

    } catch (error: any) {
        console.error('Google Calendar API Error:', error.response?.data?.error || error.message);
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unknown error occurred.';
        return { success: false, error: `Google Calendar: ${errorMessage}` };
    }
}
