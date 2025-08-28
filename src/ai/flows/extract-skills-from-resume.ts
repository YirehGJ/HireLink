'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting skills from a resume.
 *
 * - `extractSkillsFromResume` - A function that takes a resume (as a data URI) and returns a list of skills.
 * - `ExtractSkillsFromResumeInput` - The input type for the `extractSkillsFromResume` function.
 * - `ExtractSkillsFromResumeOutput` - The output type for the `extractSkillsFromResume` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractSkillsFromResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      'The resume file data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // prettier-ignore
    ),
});
export type ExtractSkillsFromResumeInput = z.infer<typeof ExtractSkillsFromResumeInputSchema>;

const SkillSchema = z.object({
  name: z.string().describe('The name of the skill.'),
  level: z
    .number()
    .min(0)
    .max(5)
    .describe('The level of proficiency in the skill (0-5).'),
  years: z
    .number()
    .min(0)
    .max(60)
    .describe('The number of years of experience with the skill.'),
  source: z.string().describe('The source of the skill information.'),
});

const ExtractSkillsFromResumeOutputSchema = z.array(SkillSchema).describe('List of skills extracted from the resume.');
export type ExtractSkillsFromResumeOutput = z.infer<typeof ExtractSkillsFromResumeOutputSchema>;

export async function extractSkillsFromResume(input: ExtractSkillsFromResumeInput): Promise<ExtractSkillsFromResumeOutput> {
  return extractSkillsFromResumeFlow(input);
}

const extractSkillsPrompt = ai.definePrompt({
  name: 'extractSkillsPrompt',
  input: {schema: ExtractSkillsFromResumeInputSchema},
  output: {schema: ExtractSkillsFromResumeOutputSchema},
  prompt: `You are an expert AI resume parser. Extract skills, skill level, and years of experience from the following resume. Return a JSON array of skills.

Resume: {{media url=resumeDataUri}}`,
});

const extractSkillsFromResumeFlow = ai.defineFlow(
  {
    name: 'extractSkillsFromResumeFlow',
    inputSchema: ExtractSkillsFromResumeInputSchema,
    outputSchema: ExtractSkillsFromResumeOutputSchema,
  },
  async input => {
    const {output} = await extractSkillsPrompt(input);
    return output!;
  }
);
