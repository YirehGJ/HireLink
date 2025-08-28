import { config } from 'dotenv';
config();

import '@/ai/flows/generate-job-recommendations.ts';
import '@/ai/flows/extract-skills-from-resume.ts';
import '@/ai/flows/filter-applications-by-ai-match.ts';