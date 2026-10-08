import {genkit} from 'genkit';
import openAICompatible, {
  compatOaiModelRef,
  defineCompatOpenAIModel,
} from '@genkit-ai/compat-oai';

export const GROQ_MODEL = 'groq/openai/gpt-oss-120b';

// Evita registrar el mismo modelo varias veces cuando hay llamadas en paralelo.
const definedModels = new Map<string, ReturnType<typeof defineCompatOpenAIModel>>();

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'groq',
      // trim(): un salto de línea o espacio pegado junto a la clave rompe la cabecera Authorization.
      apiKey: process.env.GROQ_API_KEY?.trim(),
      baseURL: 'https://api.groq.com/openai/v1',
      // Un reintento propio y un tope por llamada: así una espera larga por el límite de tokens por
      // minuto no agota los 60 s de la función (runAi ya reintenta con espera exponencial).
      maxRetries: 1,
      timeout: 25_000,
      // Los ids de Groq contienen "/" (p. ej. openai/gpt-oss-120b); el helper
      // recorta hasta el primer "/", así que anteponemos un prefijo ficticio.
      resolver: (client, actionType, actionName) => {
        if (actionType !== 'model') return undefined;
        const cached = definedModels.get(actionName);
        if (cached) return cached;
        const name = `groq/${actionName}`;
        const model = defineCompatOpenAIModel({
          name,
          client,
          // Con pluginOptions.name el helper recorta el prefijo "groq/" y envía a la
          // API el id real del modelo (p. ej. "openai/gpt-oss-120b").
          pluginOptions: { name: 'groq' } as any,
          modelRef: compatOaiModelRef({ name }),
        });
        definedModels.set(actionName, model);
        return model;
      },
    }),
  ],
  model: GROQ_MODEL,
});
