
'use server';
/**
 * @fileOverview Flujo de Genkit para extraer datos estructurados de un CV en PDF.
 *
 * - extractCvData: Llama al flujo principal para procesar el CV.
 * - CvExtractionInput: El tipo de entrada para el flujo (Data URI del PDF).
 * - CvExtractionOutput: El tipo de salida del flujo (datos estructurados del perfil).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import * as pdfParse from 'pdf-parse';

// Esquema de entrada: un Data URI que contiene el PDF.
const CvExtractionInputSchema = z.object({
  pdfDataUri: z.string().describe(
    "El CV en formato PDF, como un data URI que debe incluir un MIME type y usar codificación Base64. Formato esperado: 'data:application/pdf;base64,<encoded_data>'."
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
 * @param input La entrada con el Data URI del PDF.
 * @returns Los datos extraídos del CV.
 */
export async function extractCvData(input: CvExtractionInput): Promise<CvExtractionOutput> {
  return extractCvDataFlow(input);
}


// 1. Definir la herramienta para extraer texto del PDF
const parsePdfTool = ai.defineTool(
    {
        name: 'parsePdfTool',
        description: 'Extrae el texto de un archivo PDF proporcionado como un Data URI.',
        inputSchema: z.object({ pdfDataUri: z.string() }),
        outputSchema: z.object({ text: z.string() }),
    },
    async (input) => {
        try {
            const base64Data = input.pdfDataUri.split(',')[1];
            const pdfBuffer = Buffer.from(base64Data, 'base64');
            const data = await pdfParse(pdfBuffer);
            // Limpia el texto para eliminar espacios excesivos y saltos de línea
            const cleanedText = data.text.replace(/\s\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
            return { text: cleanedText };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            return { text: '' }; // Devuelve texto vacío en caso de error
        }
    }
);


// 2. Definir el flujo principal que orquesta la extracción
const extractCvDataFlow = ai.defineFlow(
  {
    name: 'extractCvDataFlow',
    inputSchema: CvExtractionInputSchema,
    outputSchema: CvExtractionOutputSchema,
  },
  async (input) => {
    
    // Paso 1: Usar la herramienta para extraer el texto del PDF
    const parsed = await parsePdfTool(input);

    if (!parsed.text) {
        throw new Error("No se pudo extraer texto del PDF.");
    }
    
    // Paso 2: Usar el modelo de IA para analizar el texto extraído
    const llmResponse = await ai.generate({
      prompt: `Analiza el siguiente texto extraído de un currículum vitae (CV) y extrae la información solicitada en el formato JSON especificado.

Texto del CV:
"""
${parsed.text}
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
      model: 'googleai/gemini-2.5-flash', // Usamos un modelo rápido para esta tarea
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error("La IA no pudo generar una respuesta estructurada.");
    }

    return output;
  }
);
