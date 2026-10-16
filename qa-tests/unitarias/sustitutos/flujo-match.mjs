// Sustituto del flujo de IA (src/ai/flows/match-candidate-job-flow.ts): cuenta las llamadas y responde lo que
// indique la prueba, sin tocar la red ni gastar tokens.
export async function matchCandidateToJob(input) {
  globalThis.__ia.llamadas.push(input);
  return globalThis.__ia.responder(input);
}
