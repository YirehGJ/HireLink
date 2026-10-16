/**
 * Fechas en los avisos que arma el servidor. Las funciones de Vercel corren en UTC, así que formatear
 * una fecha sin indicar la zona horaria muestra la hora de UTC (una entrevista a las 10:00 a.m. de la
 * Ciudad de México aparecía como "4:00 p.m."). El navegador envía su zona y, si falta o no es válida,
 * se usa la de Ciudad de México (el público de HireLink).
 */
export const DEFAULT_TIME_ZONE = "America/Mexico_City";

export function safeTimeZone(tz: unknown): string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("es-MX", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function formatDateTimeEs(date: Date, timeZone: string): string {
  return date.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short", timeZone });
}
