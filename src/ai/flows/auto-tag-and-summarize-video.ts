'use server';
/**
 * @fileOverview This file implements a Genkit flow to automatically generate tags and a brief description for video content.
 *
 * - autoTagAndSummarizeVideo - A function that triggers the video content analysis process.
 * - AutoTagAndSummarizeVideoInput - The input type for the autoTagAndSummarizeVideo function.
 * - AutoTagAndSummarizeVideoOutput - The return type for the autoTagAndSummarizeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Input schema for the autoTagAndSummarizeVideo flow.
 * It expects a textual representation of the video content, such as a transcript or a detailed description.
 */
const AutoTagAndSummarizeVideoInputSchema = z.object({
  videoContent: z
    .string()
    .describe(
      'A textual representation of the video content, such as a transcript or a detailed summary of its visual and auditory elements.'
    ),
});
export type AutoTagAndSummarizeVideoInput = z.infer<
  typeof AutoTagAndSummarizeVideoInputSchema
>;

/**
 * Output schema for the autoTagAndSummarizeVideo flow.
 * It returns an array of generated tags and a brief summary description for the video.
 */
const AutoTagAndSummarizeVideoOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of relevant keywords or tags for the video.'),
  description: z
    .string()
    .describe('A brief, concise summary of the video content, suitable for a video platform description.'),
});
export type AutoTagAndSummarizeVideoOutput = z.infer<
  typeof AutoTagAndSummarizeVideoOutputSchema
>;

/**
 * Wrapper function to call the Genkit flow for auto-tagging and summarizing video content.
 * @param input The video content as text.
 * @returns An object containing generated tags and a description for the video.
 */
export async function autoTagAndSummarizeVideo(
  input: AutoTagAndSummarizeVideoInput
): Promise<AutoTagAndSummarizeVideoOutput> {
  return autoTagAndSummarizeVideoFlow(input);
}

/**
 * Defines the prompt for generating video tags and descriptions.
 * It takes video content as input and expects structured JSON output for tags and description.
 */
const autoTagAndSummarizeVideoPrompt = ai.definePrompt({
  name: 'autoTagAndSummarizeVideoPrompt',
  input: {schema: AutoTagAndSummarizeVideoInputSchema},
  output: {schema: AutoTagAndSummarizeVideoOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing video content and generating metadata for video sharing platforms.
Your task is to provide relevant tags (keywords) and a concise, engaging description for a given video, based on its textual content.

Video Content:
{{{videoContent}}}

Based on the above video content, generate a list of tags and a brief description. Ensure the tags are descriptive and relevant, and the description is engaging and summarizes the video well for discoverability.`, 
});

/**
 * Defines the Genkit flow for auto-tagging and summarizing video content.
 * This flow uses the defined prompt to process the input video content.
 */
const autoTagAndSummarizeVideoFlow = ai.defineFlow(
  {
    name: 'autoTagAndSummarizeVideoFlow',
    inputSchema: AutoTagAndSummarizeVideoInputSchema,
    outputSchema: AutoTagAndSummarizeVideoOutputSchema,
  },
  async (input) => {
    const {output} = await autoTagAndSummarizeVideoPrompt(input);
    if (!output) {
      throw new Error('Failed to generate tags and description for video.');
    }
    return output;
  }
);
