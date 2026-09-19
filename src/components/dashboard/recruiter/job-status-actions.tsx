"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, Trash2 } from "lucide-react";
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
import { useAuth, useFirestore } from "@/firebase";
import { jobService } from "@/firebase/firestore/job-service";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit-client";
import type { Job } from "@/lib/types";

/**
 * Cerrar / reabrir (borrado lógico) y eliminar definitivamente una vacante.
 */
export function JobStatusActions({ job }: { job: Job }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { readOnly } = useApp();
  const [busy, setBusy] = React.useState(false);

  const isClosed = job.status === "closed";

  async function toggleStatus() {
    if (!firestore) return;
    setBusy(true);
    try {
      const next = isClosed ? "published" : "closed";
      await jobService.setStatus(firestore, job.id, next);
      logAudit(auth, {
        action: "job_status_changed",
        targetType: "job",
        targetId: job.id,
        details: `${job.title} → ${next}`,
      });
      toast({ title: isClosed ? "Vacante reabierta" : "Vacante cerrada" });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo cambiar el estado", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!firestore) return;
    setBusy(true);
    try {
      await jobService.deleteJob(firestore, job.id);
      logAudit(auth, {
        action: "job_deleted",
        targetType: "job",
        targetId: job.id,
        details: job.title,
      });
      toast({ title: "Vacante eliminada" });
      router.push("/dashboard/jobs");
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo eliminar la vacante", variant: "destructive" });
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="outline" onClick={toggleStatus} disabled={busy || readOnly}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isClosed ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
        {isClosed ? "Reabrir vacante" : "Cerrar vacante"}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy || readOnly}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta vacante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{job.title}" de forma permanente. Si solo quieres dejar de recibir
              postulaciones, usa "Cerrar vacante".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
