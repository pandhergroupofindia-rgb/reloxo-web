'use server';
/**
 * @fileOverview A Genkit flow for generating personalized video recommendations for the 'For You' feed.
 *
 * - personalizeForYouFeed - A function that generates a list of suggested video IDs based on user preferences and viewing history.
 * - PersonalizeForYouFeedInput - The input type for the personalizeForYouFeed function.
 * - PersonalizeForYouFeedOutput - The return type for the personalizeForYouFeed function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VideoMetadataSchema = z.object({
  videoId: z.string().describe('Unique identifier for the video.'),
  title: z.string().describe('Title of the video.'),
  description: z.string().describe('Short description of the video content.'),
  tags: z.array(z.string()).describe('Keywords or tags associated with the video.'),
  category: z.string().describe('Main category of the video (e.g., "dance", "comedy", "DIY").'),
});

const ViewingHistoryItemSchema = z.object({
  videoId: z.string().describe('ID of the video watched.'),
  engagementScore: z.number().describe('A score indicating user engagement with this video (e.g., 0-100). Higher means more liked.'),
});

const PersonalizeForYouFeedInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  interests: z.array(z.string()).describe('A list of keywords or categories representing the user\'s explicit interests.'),
  viewingHistory: z.array(ViewingHistoryItemSchema).describe('A list of videos the user has watched and their engagement scores.'),
  availableVideoMetadata: z.array(VideoMetadataSchema).describe('A list of available video metadata to choose from for recommendations.'),
});
export type PersonalizeForYouFeedInput = z.infer<typeof PersonalizeForYouFeedInputSchema>;

const PersonalizeForYouFeedOutputSchema = z.object({
  suggestedVideoIds: z.array(z.string()).describe('A list of video IDs recommended for the user.'),
  reasoning: z.string().describe('A brief explanation of why these videos were recommended.'),
});
export type PersonalizeForYouFeedOutput = z.infer<typeof PersonalizeForYouFeedOutputSchema>;

export async function personalizeForYouFeed(input: PersonalizeForYouFeedInput): Promise<PersonalizeForYouFeedOutput> {
  return personalizeForYouFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeForYouFeedPrompt',
  input: { schema: PersonalizeForYouFeedInputSchema },
  output: { schema: PersonalizeForYouFeedOutputSchema },
  prompt: `You are an expert content curator for a short-form video app called 'Relox'. Your task is to recommend videos for a user's personalized 'For You' feed.\n\nConsider the user's explicit interests and their past viewing history to provide highly relevant video suggestions from the available videos.\n\nPrioritize videos that align with the user's interests. Also, analyze their viewing history: videos with high engagement scores indicate strong preference for that type of content. Avoid recommending videos the user has already watched (if their ID is in viewingHistory, assume they watched it).\n\nHere is the user's information:\nUser ID: {{{userId}}}\nUser Interests:\n{{#if interests}}\n{{#each interests}}- {{{this}}}\n{{/each}}\n{{else}}No specific interests provided.\n{{/if}}\n\nUser Viewing History (videoId, engagementScore):\n{{#if viewingHistory}}\n{{#each viewingHistory}}- Video ID: {{{videoId}}}, Engagement Score: {{{engagementScore}}}\n{{/each}}\n{{else}}No viewing history available.\n{{/if}}\n\nAvailable Videos to Recommend From:\n{{#each availableVideoMetadata}}- Video ID: {{{videoId}}}, Title: "{{{title}}}", Description: "{{{description}}}", Tags: [{{#each tags}}"{{{this}}}"{{#unless @last}}, {{/unless}}{{/each}}], Category: "{{{category}}}"\n{{/each}}\n\nBased on this information, provide a list of up to 5 suggested video IDs and a brief reasoning for your choices. Ensure the suggested videos are from the 'Available Videos to Recommend From' list and are not present in the user's 'Viewing History'.`,
});

const personalizeForYouFeedFlow = ai.defineFlow(
  {
    name: 'personalizeForYouFeedFlow',
    inputSchema: PersonalizeForYouFeedInputSchema,
    outputSchema: PersonalizeForYouFeedOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
