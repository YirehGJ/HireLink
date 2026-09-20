/**
 * @fileOverview Flujo de Genkit para generar una descripción de trabajo en Markdown.
 * SOLO se usa desde Route Handlers autenticados (nunca como Server Action pública).
 *
 * - generateJobDescription: Llama al flujo principal para generar la descripción.
 * - GenerateJobDescriptionInput: El tipo de entrada para el flujo.
 * - GenerateJobDescriptionOutput: El tipo de salida del flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Esquema de entrada
const GenerateJobDescriptionInputSchema = z.object({
  title: z.string().max(200).describe("El título del puesto de trabajo. Ej: 'Ingeniero de Software Senior'."),
  seniority: z.string().max(30).describe("El nivel de experiencia requerido. Ej: 'Senior', 'Junior'."),
  searchTags: z.array(z.string().max(60)).max(40).describe("Una lista de habilidades clave, tecnologías o palabras clave relevantes. Ej: ['React', 'Node.js', 'Liderazgo']"),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

// Esquema de salida
const GenerateJobDescriptionOutputSchema = z.object({
  descriptionMd: z.string().describe("La descripción completa del puesto de trabajo, formateada en Markdown."),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

/**
 * Función exportada que los componentes de React llamarán.
 * @param input La entrada con los detalles del puesto.
 * @returns La descripción del puesto generada.
 */
export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}


const jobDescriptionPrompt = ai.definePrompt({
    name: 'jobDescriptionPrompt',
    input: { schema: GenerateJobDescriptionInputSchema },
    output: { schema: GenerateJobDescriptionOutputSchema },
    prompt: `Actúa como un experto en redacción de Recursos Humanos. Tu tarea es crear una descripción de puesto de trabajo atractiva y profesional en formato Markdown para el campo 'descriptionMd'.

Basándote en los siguientes detalles:
- Título del Puesto: {{{title}}}
- Nivel de Seniority: {{{seniority}}}
- Habilidades y Tecnologías Clave: {{{searchTags}}}

Genera una descripción que incluya las siguientes secciones:
- Un breve párrafo introductorio sobre el puesto.
- "Responsabilidades Principales" (en una lista con viñetas).
- "Cualificaciones y Habilidades" (en una lista con viñetas, basándote en los datos proporcionados).
- "Lo que Ofrecemos" (una lista con beneficios genéricos atractivos, como desarrollo profesional, buen ambiente de trabajo, etc.).

Asegúrate de que el tono sea profesional pero atractivo, y que el formato sea claro y fácil de leer. El resultado debe ser un objeto JSON que contenga la clave "descriptionMd" con el texto en Markdown.`,
});

// Define el flujo principal que orquesta la generación
const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    if (!input.title || !input.seniority) {
        throw new Error("El título y el seniority son requeridos.");
    }
    
    const { output } = await jobDescriptionPrompt(input);

    if (!output) {
      throw new Error("La IA no pudo generar una respuesta estructurada.");
    }

    return output;
  }
);
