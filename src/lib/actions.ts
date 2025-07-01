'use server';

import { generateIncidentTypes, type GenerateIncidentTypesOutput } from '@/ai/flows/generate-incident-types';

export const createIncidentTypeAction = async (description: string): Promise<{success: true, data: GenerateIncidentTypesOutput} | {success: false, error: string}> => {
  try {
    const result = await generateIncidentTypes({ incidentTypeDescription: description });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate incident type. Please try again.' };
  }
};
