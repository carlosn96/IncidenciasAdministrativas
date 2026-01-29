'use server';

import { google } from 'googleapis';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInMinutes, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Incident, Period } from './types';
import { REDIRECT_URI } from './google-oauth-client';

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
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Fetch user data and periods
        const { userProfile, period, userDocRef } = await fetchUserData(userId, periodId);

        if (!period) {
            return { success: false, error: "Periodo no encontrado." };
        }

        // Create spreadsheet if needed
        const spreadsheetId = await createSpreadsheetIfNeeded(drive, userId, userProfile, userDocRef);

        // Prepare data for the sheet
        const values = preparePeriodData(period);

        // Update the period sheet
        await updatePeriodSheet(sheets, spreadsheetId, periodId, values);

        // Update the index sheet
        await updateIndexSheet(sheets, spreadsheetId, period);

        return { success: true, spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` };
    } catch (error: any) {
        console.error("Error syncing to Google Sheet:", error);
        let errorMessage = "Un error desconocido ocurrió durante la sincronización.";
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response?.data?.error) {
            errorMessage = `Error de Google API: ${error.response.data.error}`;
        }
        return { success: false, error: errorMessage };
    }
}

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
        REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Verify the token is valid by attempting to get access token
    try {
        await oauth2Client.getAccessToken();
    } catch (error) {
        throw new Error("El token de Google ha expirado o es inválido. Por favor, reconecta tu cuenta de Google.");
    }

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


// Helper function to fetch user data and periods
async function fetchUserData(userId: string, periodId: string) {
    if (!db) {
        throw new Error("Firestore no está disponible.");
    }
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        throw new Error("No se encontraron datos de usuario.");
    }

    const userProfile = userDoc.data().userProfile || {};
    const periodsArray: Period[] = (userDoc.data().periods || []).map((p: any) => ({
        ...p,
        startDate: p.startDate.toDate(),
        endDate: p.endDate.toDate(),
    }));
    
    const period = periodsArray.find(p => p.id === periodId) || null;

    return { userProfile, period, userDocRef };
}

// Helper function to create spreadsheet if it doesn't exist
async function createSpreadsheetIfNeeded(drive: any, userId: string, userProfile: any, userDocRef: any) {
    let spreadsheetId = userProfile.googleSpreadsheetId;

    if (!spreadsheetId) {
        const folderId = userProfile.googleDriveFolderId;
        const requestBody: any = {
            name: `Reportes de Incidencias - ${userId}`,
            mimeType: 'application/vnd.google-apps.spreadsheet',
        };
        if (folderId) {
            requestBody.parents = [folderId];
        }
        const file = await drive.files.create({
            requestBody,
            fields: 'id',
        });
        spreadsheetId = file.data.id;
        if (!spreadsheetId) {
            throw new Error("No se pudo crear la hoja de cálculo de Google.");
        }
        // Save the new spreadsheet ID to user profile
        await updateDoc(userDocRef, {
            'userProfile.googleSpreadsheetId': spreadsheetId,
        });
    }

    return spreadsheetId;
}

// Helper function to prepare data for the period sheet
function preparePeriodData(period: Period) {
    const headers = [
        "Fecha",
        "Día de la Semana",
        "Lugar Entrada",
        "Hora Entrada (24h)",
        "Comentario Entrada",
        "Lugar Salida",
        "Hora Salida (24h)",
        "Comentario Salida",
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
            day.entry?.comment || '---',
            day.exit?.location || '---',
            day.exit?.time || '---',
            day.exit?.comment || '---',
            calculateWorkedHours(day.entry, day.exit)
        ];
    });

    // Calculate totals
    const totalMinutes = period.laborDays.reduce((total, day) => {
        if (!day.entry?.time || !day.exit?.time) return total;
        const [startHour, startMinute] = day.entry.time.split(":").map(Number);
        const [endHour, endMinute] = day.exit.time.split(":").map(Number);
        const startDate = new Date(0);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(0);
        endDate.setHours(endHour, endMinute, 0, 0);
        const diffMinutes = differenceInMinutes(endDate, startDate);
        return total + (diffMinutes > 0 ? diffMinutes : 0);
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const totalRow = ['', '', '', '', '', 'Total Horas:', `${totalHours}h ${totalMins}m`];

    const values = [headers, ...rows, [], totalRow];

    return values;
}

// Helper function to update the period sheet
async function updatePeriodSheet(sheets: any, spreadsheetId: string, sheetName: string, values: any[]) {
    // Check if the sheet exists, if not, add it
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
    });
    const existingSheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
    if (!existingSheet) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: sheetName,
                        },
                    },
                }],
            },
        });
    }

    // Clear and update the sheet
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName,
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: values,
        },
    });
}

// Helper function to update the index sheet by appending only if the period is not already present
async function updateIndexSheet(sheets: any, spreadsheetId: string, currentPeriod: Period) {
    const indexSheetName = 'Index';

    // Check if the sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
    });
    const indexExists = spreadsheet.data.sheets?.some((s: any) => s.properties?.title === indexSheetName);

    if (!indexExists) {
        // Create the sheet with headers and the current period
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: indexSheetName,
                        },
                    },
                }],
            },
        });

        const indexHeaders = ['Periodo', 'Fecha Inicio', 'Fecha Fin', 'UID'];
        const indexRow = [
            currentPeriod.name,
            currentPeriod.startDate.toISOString().split('T')[0],
            currentPeriod.endDate.toISOString().split('T')[0],
            currentPeriod.id
        ];
        const indexValues = [indexHeaders, indexRow];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${indexSheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: indexValues,
            },
        });
    } else {
        // Read existing values to check if the period is already in the index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${indexSheetName}!A2:D`, // Skip headers, get data rows
        });
        const existingRows = response.data.values || [];
        const existingIds = existingRows.map((row: any[]) => row[3]); // UID is in column D (index 3)

        // Check if the current period is already in the index
        if (!existingIds.includes(currentPeriod.id)) {
            // Append the new period row
            const newRow = [
                currentPeriod.name,
                currentPeriod.startDate.toISOString().split('T')[0],
                currentPeriod.endDate.toISOString().split('T')[0],
                currentPeriod.id
            ];

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${indexSheetName}!A:A`, // Append to the end
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [newRow],
                },
            });
        }
        // If it exists, do nothing
    }
}

