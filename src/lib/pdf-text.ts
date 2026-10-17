/**
 * Extrae el texto de un CV en PDF dentro del navegador (el archivo nunca se sube).
 *
 * pdf.js pesa cientos de kB: se carga con `import()` solo cuando la persona sube un CV, no al abrir la página del
 * perfil (antes se incluía siempre en esa página). El worker sale del propio sitio (carpeta public/)
 * en vez de descargarse de un CDN de terceros.
 */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export async function extractPdfText(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES) throw new Error("El PDF supera los 5 MB.");

  const pdfjs = await import("pdfjs-dist");
  // El worker se sirve desde public/ (ver scripts/copiar-worker-pdf.mjs); el nombre lleva la versión para que coincida con la API.
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.${pdfjs.version}.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  // pdf.js 6 ya no usa eval (la vulnerabilidad CVE-2024-4367 de la versión 2.16 se corrigió desde la 4.2.67), por eso
  // desaparece la opción `isEvalSupported: false` con la que antes se mitigaba.
  const doc = await pdfjs.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return text.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}
