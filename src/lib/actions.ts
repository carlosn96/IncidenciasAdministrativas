
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
    console.log(`\n--- [SERVER ACTION] INICIO: ${input.action} ---`);
    console.log(`[SERVER ACTION] Recibido: ${JSON.stringify(input, null, 2)}`);

    const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY,
    } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        const errorMsg = 'CONFIG ERROR: Las variables GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY no están configuradas en el archivo .env del servidor. Asegúrate de reiniciar el servidor después de añadirlas.';
        console.error(`[SERVER ACTION ERROR] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }
    console.log(`[SERVER ACTION] Credenciales cargadas para: ${GOOGLE_SERVICE_ACCOUNT_EMAIL}`);

     if (!input.calendarId || input.calendarId.trim() === '') {
        const errorMsg = 'CONFIG ERROR: El ID del calendario está vacío. Revisa la variable NEXT_PUBLIC_GOOGLE_CALENDAR_ID en tu archivo .env. Asegúrate de reiniciar el servidor después de cambiarla.';
        console.error(`[SERVER ACTION ERROR] ${errorMsg}`);
        return { success: false, error: errorMsg };
    }

    try {
        console.log('[SERVER ACTION] Creando cliente JWT para la autenticación con Google...');
        const jwtClient = new google.auth.JWT({
            email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        
        console.log('[SERVER ACTION] Autorizando cliente JWT...');
        await jwtClient.authorize();
        console.log('[SERVER ACTION] ¡Autorización exitosa!');
        
        const calendar = google.calendar({ version: 'v3', auth: jwtClient });
        const { action, eventId, calendarId, ...eventData } = input;
        
        if (action === 'create') {
            console.log(`[SERVER ACTION] Intentando CREAR evento en calendario: ${calendarId}`);
            if (!eventData.summary || !eventData.start || !eventData.end) {
              throw new Error('Faltan datos requeridos (summary, start, end) para crear el evento.');
            }
            const event = {
                summary: eventData.summary,
                location: eventData.location,
                start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
                end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
            };
            console.log('[SERVER ACTION] Datos del evento a enviar:', JSON.stringify(event, null, 2));
            const res = await calendar.events.insert({
                calendarId,
                requestBody: event,
            });
            console.log(`[SERVER ACTION] ¡ÉXITO! Evento CREADO. Enlace para verlo: ${res.data.htmlLink}`);
            return { success: true, eventId: res.data.id || undefined, htmlLink: res.data.htmlLink || undefined };
        } else if (action === 'update') {
            console.log(`[SERVER ACTION] Intentando ACTUALIZAR evento ${eventId} en calendario: ${calendarId}`);
            if (!eventId || !eventData.summary || !eventData.start || !eventData.end) {
                throw new Error('Faltan datos requeridos (eventId, summary, start, end) para actualizar el evento.');
            }
            const event = {
                summary: eventData.summary,
                location: eventData.location,
                start: { dateTime: eventData.start, timeZone: 'America/Mexico_City' },
                end: { dateTime: eventData.end, timeZone: 'America/Mexico_City' },
            };
            console.log('[SERVER ACTION] Datos del evento a enviar:', JSON.stringify(event, null, 2));
            const res = await calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
            });
            console.log(`[SERVER ACTION] ¡ÉXITO! Evento ACTUALIZADO. Enlace para verlo: ${res.data.htmlLink}`);
            return { success: true, eventId: res.data.id || undefined, htmlLink: res.data.htmlLink || undefined };
        } else if (action === 'delete') {
            console.log(`[SERVER ACTION] Intentando ELIMINAR evento ${eventId} del calendario: ${calendarId}`);
            if (!eventId) {
                throw new Error('Falta eventId para eliminar un evento.');
            }
            await calendar.events.delete({ calendarId, eventId });
            console.log(`[SERVER ACTION] ¡ÉXITO! Evento ELIMINADO: ${eventId}`);
            return { success: true };
        } else {
            console.error(`[SERVER ACTION ERROR] Acción inválida especificada: ${action}`);
            return { success: false, error: 'Acción inválida especificada.' };
        }

    } catch (error: any) {
        console.error('--- [SERVER ACTION] ERROR COMPLETO DE LA API DE GOOGLE ---');
        console.error(JSON.stringify(error, null, 2));
        console.error('--- FIN DEL ERROR ---');
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Ocurrió un error desconocido en el servidor.';
        return { success: false, error: `Error de Google Calendar: ${errorMessage}` };
    }
}
