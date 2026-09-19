import {genkit} from 'genkit';
import openAICompatible, {
  compatOaiModelRef,
  defineCompatOpenAIModel,
} from '@genkit-ai/compat-oai';

export const GROQ_MODEL = 'groq/openai/gpt-oss-120b';

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
        const name = `groq/${actionName}`;
        return defineCompatOpenAIModel({
          name,
          client,
          modelRef: compatOaiModelRef({ name }),
        });
      },
    }),
  ],
  model: GROQ_MODEL,
});
