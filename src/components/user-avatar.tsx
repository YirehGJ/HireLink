import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/** Número estable a partir de un texto, para asignar siempre el mismo color a la misma persona. */
function hashOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Hasta dos iniciales del nombre ("Luis Fernando Ramos" -> "LF"). */
export function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}

/**
 * Avatar con las iniciales de la persona sobre un color estable. Sustituye a las fotos
 * aleatorias de un servicio externo: no hace solicitudes de red ni comparte identificadores
 * con terceros, y no muestra una imagen que no corresponde a la persona.
 */
export function UserAvatar({ name, seed, className }: { name?: string | null; seed: string; className?: string }) {
  const hue = hashOf(seed || name || "?") % 360;
  return (
    <Avatar className={className}>
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: `hsl(${hue} 45% 38%)` }}
        aria-label={name ?? "Usuario"}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
