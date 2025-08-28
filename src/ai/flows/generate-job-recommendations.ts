'use server';

/**
 * @fileOverview A job recommendation AI agent.
 *
 * - generateJobRecommendations - A function that handles the job recommendation process.
 * - GenerateJobRecommendationsInput - The input type for the generateJobRecommendations function.
 * - GenerateJobRecommendationsOutput - The return type for the generateJobRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobSchema = z.object({
  jobId: z.string().describe('The unique identifier for the job posting.'),
  title: z.string().describe('The title of the job.'),
  descriptionMd: z.string().describe('The markdown description of the job.'),
  location: z.string().describe('The location of the job.'),
  seniority: z.string().describe('The seniority level of the job.'),
  skills: z.array(z.string()).describe('The skills required for the job.'),
});

const CandidateSchema = z.object({
  candidateId: z.string().describe('The unique identifier for the candidate.'),
  skills: z.array(z.string()).describe('The skills of the candidate.'),
  yearsOfExperience: z.number().describe('The years of experience of the candidate.'),
});

const GenerateJobRecommendationsInputSchema = z.object({
  candidate: CandidateSchema.describe('The candidate for whom to generate job recommendations.'),
  jobs: z.array(JobSchema).describe('The list of jobs to consider for recommendations.'),
});

export type GenerateJobRecommendationsInput = z.infer<typeof GenerateJobRecommendationsInputSchema>;

const JobRecommendationSchema = z.object({
  jobId: z.string().describe('The ID of the recommended job.'),
  matchPercentage: z.number().describe('The percentage of skills that match between the candidate and the job.'),
  reasons: z.array(z.string()).describe('The reasons why the job is a good fit for the candidate.'),
});

const GenerateJobRecommendationsOutputSchema = z.array(JobRecommendationSchema);

export type GenerateJobRecommendationsOutput = z.infer<typeof GenerateJobRecommendationsOutputSchema>;

export async function generateJobRecommendations(input: GenerateJobRecommendationsInput): Promise<GenerateJobRecommendationsOutput> {
  return generateJobRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobRecommendationsPrompt',
  input: {schema: GenerateJobRecommendationsInputSchema},
  output: {schema: GenerateJobRecommendationsOutputSchema},
  prompt: `You are a job recommendation expert. Given a candidate and a list of jobs, you will generate a list of job recommendations with a match percentage and reasons for each recommendation.

Candidate:
{{candidate}}

Jobs:
{{#each jobs}}
{{this}}
{{/each}}

For each job, calculate a match percentage based on the number of skills that match between the candidate and the job. Also, provide reasons why the job is a good fit for the candidate.
`,
});

const generateJobRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateJobRecommendationsFlow',
    inputSchema: GenerateJobRecommendationsInputSchema,
    outputSchema: GenerateJobRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
