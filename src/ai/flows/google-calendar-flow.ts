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
  calendarId?: string;
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
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'Google Service Account credentials are not configured in .env';
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                // The private key from .env needs newline characters to be correctly parsed.
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });
        const { action, eventId, ...eventData } = input;
        
        // CRITICAL CHANGE: The calendarId must be provided for a service account.
        // It should be the email of the calendar that the service account has been granted access to.
        const calendarId = input.calendarId;
        if (!calendarId) {
            const errorMsg = 'Calendar ID is required for service account operations. This should be the email of the calendar owner.';
            console.error(errorMsg);
            return { success: false, error: errorMsg };
        }


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
        return { success: false, error: errorMessage };
    }
}
