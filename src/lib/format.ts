import type { JobSeniority } from "@/lib/types";

/** Etiquetas de seniority, iguales en filtros, tarjetas y detalle. */
export const SENIORITY_LABEL: Record<JobSeniority, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
};

export const SENIORITY_OPTIONS = (Object.keys(SENIORITY_LABEL) as JobSeniority[]).map((value) => ({
  value,
  label: SENIORITY_LABEL[value],
}));

export function seniorityLabel(value?: string | null): string {
  if (!value) return "";
  return SENIORITY_LABEL[value as JobSeniority] ?? value;
}

/**
 * true solo para direcciones http(s). El validador `.url()` de zod acepta cualquier esquema (por ejemplo
 * `javascript:` o `foo:bar`), así que el sitio web de una empresa se comprueba con esta función.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** "1 año" / "3 años" (concordancia de número). */
export function yearsLabel(n: number | undefined | null): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return `${v} ${v === 1 ? "año" : "años"}`;
}

/**
 * Algunos modelos devuelven el Markdown con los saltos de línea escritos como el texto «\n» en vez de saltos reales, y
 * toda la descripción se ve como un solo párrafo con «##» y «-» a la vista. Si el texto no tiene saltos reales pero sí
 * secuencias «\n», se convierten en saltos de línea.
 */
export function fixEscapedNewlines(text: string | undefined | null): string {
  const s = text ?? "";
  if (s.includes("\n") || !s.includes("\\n")) return s;
  return s.replace(/\\r\\n|\\n/g, "\n").replace(/\\t/g, "  ");
}

/** Minúsculas y sin acentos, para que "diseñador" y "disenador" coincidan al buscar. */
export function normalizeText(s: string | undefined | null): string {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** true si `haystack` contiene `normalizedNeedle` (que ya debe venir normalizado). */
export function matchesText(haystack: string | undefined | null, normalizedNeedle: string): boolean {
  return normalizeText(haystack).includes(normalizedNeedle);
}

/**
 * Normaliza una lista de etiquetas escrita a mano ("React,, Node.js , react"):
 * recorta espacios, quita vacíos y duplicados (sin distinguir mayúsculas) y respeta los
 * límites de las reglas de seguridad (máx. 40 etiquetas, 60 caracteres cada una).
 */
export function parseTags(input: string, maxTags = 40, maxLength = 60): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim().slice(0, maxLength);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= maxTags) break;
  }
  return out;
}
