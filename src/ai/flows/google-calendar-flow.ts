'use server';
/**
 * @fileOverview A Genkit flow to manage Google Calendar events using a Service Account.
 *
 * - manageCalendarEvent - A function to create, update, or delete Google Calendar events.
 * - CalendarEventInput - The input type for the manageCalendarEvent function.
 * - CalendarEventOutput - The return type for the manageCalendarEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';

const CalendarEventInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete']).describe('The action to perform.'),
  calendarId: z.string().default('primary').describe('The calendar to modify.'),
  eventId: z.string().optional().describe('The ID of the event to update or delete.'),
  summary: z.string().optional().describe('The title of the event.'),
  location: z.string().optional().describe('The location of the event.'),
  start: z.string().datetime().optional().describe('The start time of the event in ISO 8601 format.'),
  end: z.string().datetime().optional().describe('The end time of the event in ISO 8601 format.'),
});
type CalendarEventInput = z.infer<typeof CalendarEventInputSchema>;

const CalendarEventOutputSchema = z.object({
  success: z.boolean(),
  eventId: z.string().optional().describe('The ID of the created or updated event.'),
  error: z.string().optional().describe('Error message if the action failed.'),
});
type CalendarEventOutput = z.infer<typeof CalendarEventOutputSchema>;

// This flow uses the googleapis library with a Service Account for authentication.
const manageCalendarEventFlow = ai.defineFlow(
  {
    name: 'manageCalendarEventFlow',
    inputSchema: CalendarEventInputSchema,
    outputSchema: CalendarEventOutputSchema,
  },
  async (input: CalendarEventInput): Promise<CalendarEventOutput> => {
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'Google Service Account credentials are not configured in .env';
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });
        const { action, calendarId, eventId, ...eventData } = input;

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
);

export async function manageCalendarEvent(input: CalendarEventInput): Promise<CalendarEventOutput> {
  return manageCalendarEventFlow(input);
}
