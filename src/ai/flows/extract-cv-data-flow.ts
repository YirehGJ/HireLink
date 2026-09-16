
'use server';
/**
 * @fileOverview Flujo de Genkit para extraer datos estructurados de un texto de CV.
 *
 * - extractCvData: Llama al flujo principal para procesar el texto del CV.
 * - CvExtractionInput: El tipo de entrada para el flujo (texto del CV).
 * - CvExtractionOutput: El tipo de salida del flujo (datos estructurados del perfil).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Esquema de entrada: el texto extraído de un CV.
const CvExtractionInputSchema = z.object({
  cvText: z.string().describe(
    "El texto completo extraído de un currículum vitae."
  ),
});
export type CvExtractionInput = z.infer<typeof CvExtractionInputSchema>;

// Esquema para una habilidad individual
const SkillSchema = z.object({
    name: z.string().describe("Nombre de la habilidad, tecnología o competencia. Ej: 'React', 'Liderazgo de equipos'."),
    level: z.coerce.number().describe("Nivel de dominio de la habilidad, en una escala de 1 (principiante) a 5 (experto)."),
    years: z.coerce.number().describe("Años de experiencia con la habilidad."),
});

// Esquema de salida: los datos estructurados que se extraerán del CV.
const CvExtractionOutputSchema = z.object({
    headline: z.string().describe("El titular profesional o el rol más reciente del candidato. Ej: 'Ingeniero de Software Senior' o 'Desarrollador Full-Stack'."),
    location: z.string().describe("La ciudad y país de residencia del candidato. Ej: 'Ciudad de México, México'."),
    yearsOfExperience: z.coerce.number().describe("El número total de años de experiencia profesional relevante que se puedan inferir del CV."),
    skills: z.array(SkillSchema).describe("Una lista de las habilidades técnicas y blandas más relevantes del candidato."),
});
export type CvExtractionOutput = z.infer<typeof CvExtractionOutputSchema>;


/**
 * Función exportada que los componentes de React llamarán.
 * @param input La entrada con el texto del CV.
 * @returns Los datos extraídos del CV.
 */
export async function extractCvData(input: CvExtractionInput): Promise<CvExtractionOutput> {
  return extractCvDataFlow(input);
}

// Define el flujo principal que orquesta la extracción
const extractCvDataFlow = ai.defineFlow(
  {
    name: 'extractCvDataFlow',
    inputSchema: CvExtractionInputSchema,
    outputSchema: CvExtractionOutputSchema,
  },
  async (input) => {
    if (!input.cvText) {
        throw new Error("No se proporcionó texto del CV.");
    }
    
    const llmResponse = await ai.generate({
      prompt: `Analiza el siguiente texto extraído de un currículum vitae (CV) y extrae la información solicitada en el formato JSON especificado.

Texto del CV:
"""
${input.cvText}
"""

Extrae los siguientes campos:
- headline: El titular profesional del candidato.
- location: La ubicación del candidato.
- yearsOfExperience: El total de años de experiencia profesional. Si no se especifica, intenta calcularlo a partir de las fechas de los trabajos.
- skills: Una lista de las habilidades más importantes, con su nombre, un nivel de dominio estimado de 1 a 5, y los años de experiencia si es posible.

Sé conciso y preciso.`,
      output: {
        schema: CvExtractionOutputSchema,
        format: 'json'
      },
      model: 'gemini-2.5-flash',
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error("La IA no pudo generar una respuesta estructurada.");
    }

    return output;
  }
);
