import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo de HireLink. Hay dos tratamientos (marca sola y marca con el nombre) y cada uno en negro (tema claro) y en
 * blanco (tema oscuro). Se dibujan las dos versiones y el CSS muestra la que corresponde al tema, así no hay
 * parpadeo ni diferencia entre el servidor y el navegador.
 */
const MEDIDAS = {
  marca: { claro: "/brand/logo-marca-negra.png", oscuro: "/brand/logo-marca-blanca.png", ancho: 258, alto: 320 },
  nombre: { claro: "/brand/logo-nombre-negro.png", oscuro: "/brand/logo-nombre-blanco.png", ancho: 900, alto: 428 },
} as const;

type LogoProps = {
  variante?: keyof typeof MEDIDAS;
  /** Define el tamaño con la altura (por ejemplo `h-10`); el ancho se calcula solo. */
  className?: string;
  /** Texto para lectores de pantalla. Si el logo va junto a un texto que ya dice «HireLink», se deja vacío. */
  alt?: string;
};

export function Logo({ variante = "nombre", className, alt = "HireLink" }: LogoProps) {
  const m = MEDIDAS[variante];
  const comun = { width: m.ancho, height: m.alto, alt, unoptimized: true, priority: false } as const;
  return (
    <>
      <Image {...comun} src={m.claro} className={cn("w-auto dark:hidden", className)} />
      <Image {...comun} src={m.oscuro} className={cn("hidden w-auto dark:block", className)} />
    </>
  );
}
