import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de forma segura.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un saludo basado en la hora del día.
 * Útil para evitar hidratación fallida si se usa dentro de useEffect.
 */
export function getGreeting() {
  const hours = new Date().getHours();
  if (hours < 12) return "Buenos días";
  if (hours < 18) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Formatea una fecha de forma segura.
 */
export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
}
