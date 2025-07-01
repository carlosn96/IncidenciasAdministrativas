'use server';

import { generateInspirationalQuote, type InspirationalQuoteOutput } from '@/ai/flows/generate-inspirational-quote';
import { generateIncidentTypes, type GenerateIncidentTypesOutput } from '@/ai/flows/generate-incident-types';

export const getInspirationalQuoteAction = async (topic: string): Promise<{success: true, data: InspirationalQuoteOutput} | {success: false, error: string}> => {
  try {
    const result = await generateInspirationalQuote({ topic });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate a new quote. Please try again.' };
  }
};

export const createIncidentTypeAction = async (description: string): Promise<{success: true, data: GenerateIncidentTypesOutput} | {success: false, error: string}> => {
  try {
    const result = await generateIncidentTypes({ incidentTypeDescription: description });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate incident type. Please try again.' };
  }
};
