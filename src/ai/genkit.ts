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
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
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
          modelRef: compatOaiModelRef({ name }),
        });
        definedModels.set(actionName, model);
        return model;
      },
    }),
  ],
  model: GROQ_MODEL,
});
