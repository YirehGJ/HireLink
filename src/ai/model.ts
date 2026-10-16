/**
 * Modelo de IA que se usa en Groq. Por defecto `openai/gpt-oss-120b`.
 *
 * En el plan gratuito cada modelo tiene su propio cupo diario (200 000 tokens al día para este), así que si
 * se agota se puede seguir trabajando con otro definiendo `GROQ_MODEL_ID` (por ejemplo `openai/gpt-oss-20b`)
 * en las variables de entorno y volviendo a desplegar. Las pruebas automáticas contra staging también lo
 * usan para no consumir el cupo que comparte producción.
 */
export const GROQ_MODEL_ID = process.env.GROQ_MODEL_ID?.trim() || "openai/gpt-oss-120b";

/** Referencia del modelo para Genkit (prefijo del plugin + id de Groq). */
export const GROQ_MODEL = `groq/${GROQ_MODEL_ID}`;

/** Etiqueta que se guarda en cada recomendación y entra en su huella: al cambiar de modelo se recalcula. */
export const ENGINE_VERSION = `groq-${GROQ_MODEL_ID.split("/").pop()}`;
