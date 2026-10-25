"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/firebase";
import { useApp } from "@/components/providers/app-provider";
import { callAuthedApi } from "@/lib/api-client";
import { markIntentionalSignOut } from "@/lib/auth-flags";
import { toast } from "@/hooks/use-toast";

/** Palabra que la persona debe escribir para confirmar (la misma que exige `/api/account/delete`). */
const CONFIRM_WORD = "ELIMINAR";

/**
 * «Eliminar mi cuenta»: la persona borra su cuenta y sus datos (derecho de cancelación). Pide escribir una palabra
 * para evitar clics accidentales; el servidor hace el borrado completo y la sesión se cierra.
 */
export function DeleteAccountSection() {
  const auth = useAuth();
  const router = useRouter();
  const { user, readOnly, setUser } = useApp();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!user) return null;

  async function removeAccount() {
    if (!auth) return;
    setBusy(true);
    try {
      await callAuthedApi(auth, "/api/account/delete", { confirm: CONFIRM_WORD });
    } catch (error: any) {
      console.error("No se pudo eliminar la cuenta:", error);
      toast({ title: "No se pudo eliminar la cuenta", description: error?.message, variant: "destructive" });
      setBusy(false);
      return;
    }
    // La cuenta ya no existe: se cierra la sesión local y se vuelve a la portada.
    markIntentionalSignOut();
    await signOut(auth).catch(() => {});
    setUser(null);
    toast({ title: "Tu cuenta se eliminó", description: "Borramos tu perfil y tus datos de HireLink." });
    router.push("/");
  }

  return (
    <section aria-labelledby="eliminar-cuenta" className="mt-10 rounded-lg border border-destructive/40 p-4">
      <h3 id="eliminar-cuenta" className="text-md font-medium text-destructive">Eliminar mi cuenta</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Borra tu perfil, tus postulaciones, avisos y todo lo que depende de tu cuenta
        {user.role === "recruiter" ? "; si eres la última reclutadora de tu empresa, también la empresa y sus vacantes" : ""}.
        No se puede deshacer.
      </p>
      <Button
        type="button"
        variant="destructive"
        className="mt-4"
        disabled={readOnly}
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar mi cuenta
      </Button>

      <AlertDialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta para siempre?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán tus datos y no podrás recuperarlos. Para confirmar, escribe <strong>{CONFIRM_WORD}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmar-eliminar">Confirmación</Label>
            <Input
              id="confirmar-eliminar"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder={CONFIRM_WORD}
              disabled={busy}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={typed.trim() !== CONFIRM_WORD || busy} onClick={removeAccount}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar definitivamente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
