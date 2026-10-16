import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Página 404 en español para las rutas públicas (la de Next.js por defecto está en inglés). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">No encontramos esta página</h1>
      <p className="max-w-md text-muted-foreground">
        La dirección no existe o fue eliminada. Revisa que esté bien escrita o vuelve al inicio.
      </p>
      <Button asChild>
        <Link href="/">Ir al inicio</Link>
      </Button>
    </div>
  );
}
