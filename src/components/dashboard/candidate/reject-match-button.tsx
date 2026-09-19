"use client";

import * as React from "react";
import { Loader2, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/firebase";
import { callAuthedApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

/**
 * El candidato puede rechazar un match en cualquier momento (incluso si la
 * empresa ya lo aceptó, en cuyo caso su postulación se retira).
 */
export function RejectMatchButton({ recommendationId, jobTitle }: { recommendationId: string; jobTitle: string }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function reject() {
    if (!auth) return;
    setBusy(true);
    try {
      await callAuthedApi(auth, "/api/matches/respond", { recId: recommendationId, action: "reject" });
      toast({ title: "Match rechazado", description: "Ya no aparecerá en tus recomendaciones." });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo rechazar el match", variant: "destructive" });
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
          Rechazar match
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Rechazar este match?</AlertDialogTitle>
          <AlertDialogDescription>
            Dejarás de ver "{jobTitle}" entre tus recomendaciones y la empresa será notificada. Si ya habías sido
            aceptado, tu postulación se retirará.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={reject}>Sí, rechazar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
