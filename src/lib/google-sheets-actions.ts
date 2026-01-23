
'use server';

import { google } from 'googleapis';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Incident, Period } from './types';


// Helper function to create an authenticated OAuth2 client
async function getAuthenticatedClient(userId: string) {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || !userDoc.data().userProfile?.googleRefreshToken) {
        throw new Error("El usuario no ha conectado su cuenta de Google o no se encontró el token.");
    }

    const refreshToken = userDoc.data().userProfile.googleRefreshToken;
    
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
            : 'http://localhost:9002/api/auth/google/callback'
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return oauth2Client;
}


// Helper function to calculate worked hours
const calculateWorkedHours = (entry?: Incident, exit?: Incident): string => {
    if (!entry?.time || !exit?.time) return "N/A";
    const [startHour, startMinute] = entry.time.split(":").map(Number);
    const [endHour, endMinute] = exit.time.split(":").map(Number);
    const startDate = new Date(0);
    startDate.setHours(startHour, startMinute, 0, 0);
    const endDate = new Date(0);
    endDate.setHours(endHour, endMinute, 0, 0);
    const diffMinutes = differenceInMinutes(endDate, startDate);
    if (diffMinutes < 0) return "N/A";
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
};


export async function syncPeriodToSheet(periodId: string, userId: string) {
    if (!userId) {
        return { success: false, error: "Usuario no autenticado." };
    }
     if (!db) {
        return { success: false, error: "Firestore no está disponible." };
    }

    try {
        const oauth2Client = await getAuthenticatedClient(userId);
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        
        // 1. Fetch Period Data from Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             return { success: false, error: "No se encontraron datos de usuario." };
        }
        
        const periods = (userDoc.data().periods || []).map((p: any) => ({
            ...p,
            startDate: p.startDate.toDate(),
            endDate: p.endDate.toDate(),
          }));

        const period: Period | undefined = periods.find((p: Period) => p.id === periodId);

        if (!period) {
            return { success: false, error: "Periodo no encontrado." };
        }

        let spreadsheetId = period.googleSheetId;

        // 2. Create Spreadsheet if it doesn't exist
        if (!spreadsheetId) {
            const spreadsheet = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: `Reporte de Incidencias - ${period.name}`,
                    },
                },
            });
            spreadsheetId = spreadsheet.data.spreadsheetId ?? undefined;
            if (!spreadsheetId) {
                throw new Error("No se pudo crear la hoja de cálculo de Google.");
            }
            
            // Save the new spreadsheet ID back to the period in Firestore
            const updatedPeriods = userDoc.data().periods.map((p: any) => 
                p.id === periodId ? { ...p, googleSheetId: spreadsheetId } : p
            );
            await setDoc(userDocRef, { periods: updatedPeriods }, { merge: true });
        }
        
        // 3. Prepare data for the sheet
        const headers = [
            "Fecha",
            "Día de la Semana",
            "Lugar Entrada",
            "Hora Entrada (24h)",
            "Lugar Salida",
            "Hora Salida (24h)",
            "Horas Laboradas",
        ];

        const rows = period.laborDays.map(day => {
            const date = parseISO(day.date);
            const dayOfWeek = format(date, "EEEE", { locale: es });
            const formattedDate = format(date, "yyyy-MM-dd");

            return [
                formattedDate,
                dayOfWeek,
                day.entry?.location || '---',
                day.entry?.time || '---',
                day.exit?.location || '---',
                day.exit?.time || '---',
                calculateWorkedHours(day.entry, day.exit)
            ];
        });

        const values = [headers, ...rows];
        
        // 4. Clear and write data to the sheet
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Sheet1', // Assumes default sheet name
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });
        
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

        return { success: true, spreadsheetUrl };

    } catch (error: any) {
        console.error("Error syncing to Google Sheet:", error);
        return { success: false, error: error.message || "Un error desconocido ocurrió durante la sincronización." };
    }
}
