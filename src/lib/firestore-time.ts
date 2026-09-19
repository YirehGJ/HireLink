/**
 * Normaliza cualquier fecha que pueda venir de Firestore
 * (Timestamp, {seconds}, string, number, Date) a un Date de JavaScript.
 */
export type FireTime =
  | Date
  | { toDate?: () => Date; seconds?: number; nanoseconds?: number }
  | string
  | number
  | null
  | undefined;

export function toJsDate(v: FireTime): Date {
  if (v instanceof Date) return v;
  if (!v) return new Date(NaN);
  const anyV = v as any;
  if (typeof anyV?.toDate === "function") return anyV.toDate();
  if (typeof anyV?.seconds === "number") return new Date(anyV.seconds * 1000);
  return new Date(anyV as string | number);
}

export function toMillis(v: FireTime): number {
  const t = toJsDate(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function formatDate(v: FireTime, locale = "es-MX"): string {
  const d = toJsDate(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(locale);
}

export function formatDateTime(v: FireTime, locale = "es-MX"): string {
  const d = toJsDate(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}
