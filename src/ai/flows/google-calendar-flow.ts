'use server';
/**
 * @fileOverview A Genkit flow to manage Google Calendar events.
 *
 * - manageCalendarEvent - A function to create, update, or delete Google Calendar events.
 * - CalendarEventInput - The input type for the manageCalendarEvent function.
 * - CalendarEventOutput - The return type for the manageCalendarEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';

export const CalendarEventInputSchema = z.object({
  accessToken: z.string().describe("The user's Google OAuth2 access token."),
  action: z.enum(['create', 'update', 'delete']).describe('The action to perform.'),
  calendarId: z.string().default('primary').describe('The calendar to modify.'),
  eventId: z.string().optional().describe('The ID of the event to update or delete.'),
  summary: z.string().optional().describe('The title of the event.'),
  location: z.string().optional().describe('The location of the event.'),
  start: z.string().datetime().optional().describe('The start time of the event in ISO 8601 format.'),
  end: z.string().datetime().optional().describe('The end time of the event in ISO 8601 format.'),
});
export type CalendarEventInput = z.infer<typeof CalendarEventInputSchema>;

export const CalendarEventOutputSchema = z.object({
  success: z.boolean(),
  eventId: z.string().optional().describe('The ID of the created or updated event.'),
  error: z.string().optional().describe('Error message if the action failed.'),
});
export type CalendarEventOutput = z.infer<typeof CalendarEventOutputSchema>;

// This is not an AI flow, but a utility function wrapped as a flow for consistency.
// We use defineFlow to leverage Genkit's infrastructure if needed (e.g., logging, auth).
const manageCalendarEventFlow = ai.defineFlow(
  {
    name: 'manageCalendarEventFlow',
    inputSchema: CalendarEventInputSchema,
    outputSchema: CalendarEventOutputSchema,
  },
  async (input: CalendarEventInput): Promise<CalendarEventOutput> => {
    const { accessToken, action, calendarId, eventId, ...eventData } = input;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      if (action === 'create') {
        if (!eventData.summary || !eventData.start || !eventData.end) {
          throw new Error('Missing required fields for creating an event.');
        }
        const response = await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: eventData.summary,
            location: eventData.location,
            start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
            end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
          },
        });
        return { success: true, eventId: response.data.id! };
      } else if (action === 'update') {
        if (!eventId || !eventData.summary || !eventData.start || !eventData.end) {
          throw new Error('Missing required fields for updating an event.');
        }
        const response = await calendar.events.update({
          calendarId,
          eventId,
          requestBody: {
            summary: eventData.summary,
            location: eventData.location,
            start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
            end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
          },
        });
        return { success: true, eventId: response.data.id! };
      } else if (action === 'delete') {
        if (!eventId) {
          throw new Error('Missing eventId for deleting an event.');
        }
        await calendar.events.delete({
          calendarId,
          eventId,
        });
        return { success: true };
      }
      return { success: false, error: 'Invalid action specified.' };
    } catch (error: any) {
      console.error(`Google Calendar API Error: ${error.message}`);
      // Check for token expiration error
      if (error.code === 401) {
        return { success: false, error: 'Token expired. Please sign in again.' };
      }
      return { success: false, error: error.message };
    }
  }
);

export async function manageCalendarEvent(input: CalendarEventInput): Promise<CalendarEventOutput> {
  return manageCalendarEventFlow(input);
}
