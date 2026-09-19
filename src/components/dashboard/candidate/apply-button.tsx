"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useDoc } from "@/firebase";
import { applicationService } from "@/firebase/firestore/application-service";
import type { Application, Candidate, Job } from "@/lib/types";
import { Loader2, CheckCircle } from "lucide-react";
import { callAuthedApi } from "@/lib/api-client";
export function ApplyButton({ job, className }: { job: Job; className?: string }) {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const uid = auth?.currentUser?.uid ?? null;

  const { data: candidate } = useDoc<Candidate>(uid ? `candidates/${uid}` : null);
  const { data: applications, loading } = useDoc<Application>(
    uid ? `jobs/${job.id}/applications/${uid}` : null
  );

  const [isApplying, setIsApplying] = React.useState(false);
  const alreadyApplied = !!applications;

  async function handleApply() {
    if (!firestore || !uid) return;
    setIsApplying(true);
    try {
      await applicationService.applyToJob(firestore, job.id, uid, candidate?.resumeRef);
      // Avisa a los reclutadores de la empresa (en segundo plano, no bloquea).
      if (auth) {
        callAuthedApi(auth, "/api/applications/notify-new", { jobId: job.id }).catch((err) =>
          console.error("No se pudo notificar a la empresa:", err)
        );
      }
      toast({
        title: "¡Postulación enviada!",
        description: `Has aplicado exitosamente a la vacante de ${job.title}.`,
      });
    } catch (error) {
      console.error("Error applying to job:", error);
      toast({
        title: "Error al postular",
        description: "No se pudo enviar tu postulación. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  }

  if (alreadyApplied) {
    return (
      <Button disabled variant="secondary" className={className}>
        <CheckCircle className="mr-2 h-4 w-4" /> Ya postulaste
      </Button>
    );
  }

  if (job.status !== "published") {
    return (
      <Button disabled variant="outline" className={className}>
        Vacante cerrada
      </Button>
    );
  }

  return (
    <Button onClick={handleApply} disabled={isApplying || loading || !uid} className={className}>
      {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Postularme ahora
    </Button>
  );
}
