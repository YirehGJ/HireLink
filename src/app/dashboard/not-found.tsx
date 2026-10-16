import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 dentro del dashboard (por ejemplo, una vacante que ya no existe): conserva la barra lateral
 * y ofrece volver, en lugar de la pantalla en inglés de Next.js.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-2xl font-bold">No encontramos lo que buscas</h2>
      <p className="max-w-md text-muted-foreground">
        Puede que la vacante o el perfil ya no exista, o que el enlace esté incompleto.
      </p>
      <Button asChild>
        <Link href="/dashboard">Ir a mi inicio</Link>
      </Button>
    </div>
  );
}
