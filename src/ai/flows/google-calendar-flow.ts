'use server';
/**
 * @fileOverview A Genkit flow to manage Google Calendar events using direct fetch calls.
 *
 * - manageCalendarEvent - A function to create, update, or delete Google Calendar events.
 * - CalendarEventInput - The input type for the manageCalendarEvent function.
 * - CalendarEventOutput - The return type for the manageCalendarEvent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CalendarEventInputSchema = z.object({
  accessToken: z.string().describe("The user's Google OAuth2 access token."),
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

// This flow uses direct fetch calls to the Google Calendar API for robustness.
const manageCalendarEventFlow = ai.defineFlow(
  {
    name: 'manageCalendarEventFlow',
    inputSchema: CalendarEventInputSchema,
    outputSchema: CalendarEventOutputSchema,
  },
  async (input: CalendarEventInput): Promise<CalendarEventOutput> => {
    const { accessToken, action, calendarId, eventId, ...eventData } = input;
    const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars';

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      let url = `${BASE_URL}/${calendarId}/events`;
      let method: 'POST' | 'PUT' | 'DELETE' | 'GET' = 'POST';
      let body: string | undefined = undefined;

      if (action === 'create') {
        if (!eventData.summary || !eventData.start || !eventData.end) {
          throw new Error('Missing required fields for creating an event.');
        }
        method = 'POST';
        body = JSON.stringify({
          summary: eventData.summary,
          location: eventData.location,
          start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
          end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
        });
      } else if (action === 'update') {
        if (!eventId || !eventData.summary || !eventData.start || !eventData.end) {
          throw new Error('Missing required fields for updating an event.');
        }
        url = `${url}/${eventId}`;
        method = 'PUT';
        body = JSON.stringify({
          summary: eventData.summary,
          location: eventData.location,
          start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
          end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
        });
      } else if (action === 'delete') {
        if (!eventId) {
          throw new Error('Missing eventId for deleting an event.');
        }
        url = `${url}/${eventId}`;
        method = 'DELETE';
      } else {
        return { success: false, error: 'Invalid action specified.' };
      }

      const response = await fetch(url, { method, headers, body });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
        console.error('Google Calendar API Error:', errorMessage, errorData);
        if (response.status === 401) {
            return { success: false, error: 'Token de acceso expirado o inválido. Por favor, inicia sesión de nuevo.' };
        }
        return { success: false, error: errorMessage };
      }

      if (action === 'delete') {
        return { success: true };
      }

      const responseData = await response.json();
      return { success: true, eventId: responseData.id };

    } catch (error: any) {
      console.error(`Google Calendar Flow Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
);

export async function manageCalendarEvent(input: CalendarEventInput): Promise<CalendarEventOutput> {
  return manageCalendarEventFlow(input);
}
