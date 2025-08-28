'use server';
/**
 * @fileOverview Filters job applications based on how well the candidate's skills match the job description.
 *
 * - filterApplicationsByAiMatch - A function that filters job applications by AI match.
 * - FilterApplicationsByAiMatchInput - The input type for the filterApplicationsByAiMatch function.
 * - FilterApplicationsByAiMatchOutput - The return type for the filterApplicationsByAiMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterApplicationsByAiMatchInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  candidateSkills: z.array(z.string()).describe('The skills of the candidate.'),
});
export type FilterApplicationsByAiMatchInput = z.infer<
  typeof FilterApplicationsByAiMatchInputSchema
>;

const FilterApplicationsByAiMatchOutputSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A score between 0 and 1 representing how well the candidate skills match the job description. 1 is a perfect match.'
    ),
  reasons: z
    .array(z.string())
    .describe(
      'A list of reasons explaining the match score. Empty if the score is 0.'
    ),
});
export type FilterApplicationsByAiMatchOutput = z.infer<
  typeof FilterApplicationsByAiMatchOutputSchema
>;

export async function filterApplicationsByAiMatch(
  input: FilterApplicationsByAiMatchInput
): Promise<FilterApplicationsByAiMatchOutput> {
  return filterApplicationsByAiMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterApplicationsByAiMatchPrompt',
  input: {schema: FilterApplicationsByAiMatchInputSchema},
  output: {schema: FilterApplicationsByAiMatchOutputSchema},
  prompt: `You are an AI assistant helping recruiters filter job applications based on skill match.\n\nGiven the following job description:\n\n{{jobDescription}}\n\nAnd the following candidate skills:\n\n{{#each candidateSkills}}- {{this}}\n{{/each}}\n\nDetermine a match score between 0 and 1, where 1 is a perfect match. Also, provide a list of reasons supporting the match score. If the score is 0, the reasons should be empty.\n\nConsider skills that are highly relevant to the job description as strong indicators of a good match. Skills that are somewhat relevant should contribute less to the score. Skills that are irrelevant should not contribute to the score.\n\nReturn the match score and reasons in JSON format.`,
});

const filterApplicationsByAiMatchFlow = ai.defineFlow(
  {
    name: 'filterApplicationsByAiMatchFlow',
    inputSchema: FilterApplicationsByAiMatchInputSchema,
    outputSchema: FilterApplicationsByAiMatchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
