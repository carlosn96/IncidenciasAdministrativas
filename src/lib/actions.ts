
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
  calendarId: string; // The ID of the target calendar (usually the user's primary calendar email).
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
  htmlLink?: string;
};


export async function manageCalendarEvent(input: CalendarEventInput): Promise<CalendarEventOutput> {
    console.log(`[SERVER ACTION] Received request: ${JSON.stringify(input)}`);

    const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY,
    } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'Google Service Account credentials are not configured in .env on the server.';
        console.error(`[SERVER ACTION ERROR] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }
     if (!input.calendarId) {
        const errorMsg = 'Calendar ID was not provided in the request from the client.';
        console.error(`[SERVER ACTION ERROR] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }

    try {
        console.log('[SERVER ACTION] Creating JWT client for Google Auth...');
        const jwtClient = new google.auth.JWT({
            email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        
        console.log('[SERVER ACTION] Authorizing JWT client...');
        await jwtClient.authorize();
        console.log('[SERVER ACTION] Authorization successful.');
        
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });
        const { action, eventId, calendarId, ...eventData } = input;
        
        if (action === 'create') {
            console.log(`[SERVER ACTION] Attempting to CREATE event in calendar: ${calendarId}`);
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
            console.log(`[SERVER ACTION] Event CREATED successfully. View it here: ${res.data.htmlLink}`);
            return { success: true, eventId: res.data.id || undefined, htmlLink: res.data.htmlLink || undefined };
        } else if (action === 'update') {
            console.log(`[SERVER ACTION] Attempting to UPDATE event ${eventId} in calendar: ${calendarId}`);
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
            console.log(`[SERVER ACTION] Event UPDATED successfully. View it here: ${res.data.htmlLink}`);
            return { success: true, eventId: res.data.id || undefined, htmlLink: res.data.htmlLink || undefined };
        } else if (action === 'delete') {
            console.log(`[SERVER ACTION] Attempting to DELETE event ${eventId} from calendar: ${calendarId}`);
            if (!eventId) {
                throw new Error('Missing eventId for deleting an event.');
            }
            await calendar.events.delete({ calendarId, eventId });
            console.log(`[SERVER ACTION] Event DELETED successfully: ${eventId}`);
            return { success: true };
        } else {
            return { success: false, error: 'Invalid action specified.' };
        }

    } catch (error: any) {
        console.error('--- FULL GOOGLE CALENDAR API ERROR ---');
        // Log the full structure of the error for detailed diagnosis
        console.error(JSON.stringify(error, null, 2));
        console.error('--- END OF ERROR ---');
        
        // Extract a user-friendly message
        const errorMessage = error.response?.data?.error?.message || error.message || 'An unknown error occurred on the server.';
        return { success: false, error: `Error de Google Calendar: ${errorMessage}` };
    }
}
