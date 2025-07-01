'use server';
/**
 * @fileOverview Generates an inspirational quote using a Genkit flow.
 *
 * - generateInspirationalQuote - A function that generates an inspirational quote.
 * - InspirationalQuoteInput - The input type for the generateInspirationalQuote function.
 * - InspirationalQuoteOutput - The return type for the generateInspirationalQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InspirationalQuoteInputSchema = z.object({
  topic: z.string().optional().describe('Optional topic for the inspirational quote.'),
});
export type InspirationalQuoteInput = z.infer<typeof InspirationalQuoteInputSchema>;

const InspirationalQuoteOutputSchema = z.object({
  quote: z.string().describe('The generated inspirational quote.'),
  author: z.string().describe('The author of the quote.'),
});
export type InspirationalQuoteOutput = z.infer<typeof InspirationalQuoteOutputSchema>;

export async function generateInspirationalQuote(input: InspirationalQuoteInput): Promise<InspirationalQuoteOutput> {
  return generateInspirationalQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'inspirationalQuotePrompt',
  input: {schema: InspirationalQuoteInputSchema},
  output: {schema: InspirationalQuoteOutputSchema},
  prompt: `You are an AI that generates inspirational quotes. The user may optionally provide a topic.

  Topic: {{topic}}
  
  Generate an inspirational quote. Return the quote and the author of the quote.
  Ensure the quote is appropriate for a work environment and promotes positivity and motivation.`,
});

const generateInspirationalQuoteFlow = ai.defineFlow(
  {
    name: 'generateInspirationalQuoteFlow',
    inputSchema: InspirationalQuoteInputSchema,
    outputSchema: InspirationalQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
