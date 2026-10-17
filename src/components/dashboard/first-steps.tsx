"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/components/providers/app-provider";
import { useCandidateApplications, useCollection, useDoc } from "@/firebase";
import { cn } from "@/lib/utils";
import type { Candidate, Job } from "@/lib/types";

/**
 * Guía del primer ingreso (S28): una lista corta de pasos con su avance real, calculado con los datos de la persona.
 * Se puede cerrar (se recuerda en este navegador) y desaparece sola cuando se completan los pasos obligatorios.
 */
interface Step {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
  /** Un paso opcional se muestra, pero no impide que la guía desaparezca. */
  optional?: boolean;
}

function storageKey(uid: string) {
  return `hirelink:primeros-pasos:${uid}`;
}

function FirstStepsCard({ uid, steps, footer }: { uid: string; steps: Step[]; footer?: string }) {
  // Oculta hasta leer la preferencia guardada, para que no aparezca un instante y desaparezca.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey(uid)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [uid]);

  const required = steps.filter((s) => !s.optional);
  if (dismissed || required.every((s) => s.done)) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey(uid), "1");
    } catch {
      /* sin almacenamiento disponible: se oculta solo en esta visita */
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-xl md:text-2xl">Primeros pasos</CardTitle>
          <CardDescription>
            {doneCount} de {steps.length} completados
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={close} aria-label="Cerrar los primeros pasos">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(doneCount / steps.length) * 100} aria-label="Avance de los primeros pasos" className="h-2" />
        <ol className="space-y-3">
          {steps.map((s) => (
            <li key={s.id} className="flex items-start gap-3">
              {s.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", s.done && "text-muted-foreground line-through")}>
                  {s.label}
                  {s.optional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
                  <span className="sr-only">{s.done ? ". Completado" : ". Pendiente"}</span>
                </p>
                <p className="text-sm text-muted-foreground">{s.hint}</p>
              </div>
              {!s.done && (
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link href={s.href}>
                    Ir<span className="sr-only">: {s.label}</span>
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
        {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
      </CardContent>
    </Card>
  );
}

export function CandidateFirstSteps() {
  const { user } = useApp();
  const { data: profile, loading: profileLoading } = useDoc<Candidate>(user ? `candidates/${user.id}` : null);
  const { data: applications, loading: appsLoading } = useCandidateApplications(user?.id ?? null);
  if (!user || profileLoading || appsLoading) return null;

  const steps: Step[] = [
    {
      id: "perfil",
      label: "Completa tu perfil",
      hint: "Titular, ubicación y al menos una habilidad: con eso la IA ya puede recomendarte vacantes.",
      href: "/dashboard/profile",
      done: !!profile?.headline && (profile.skills?.length ?? 0) > 0,
    },
    {
      id: "cv",
      label: "Deja que la IA lea tu CV",
      hint: "Sube un PDF y revisa la vista previa antes de aplicar nada. El archivo no se guarda.",
      href: "/dashboard/profile",
      done: !!profile?.cvSummary,
      optional: true,
    },
    {
      id: "postular",
      label: "Postúlate a una vacante",
      hint: "Usa las recomendaciones de esta página o explora todas las vacantes.",
      href: "/dashboard/explore",
      done: (applications?.length ?? 0) > 0,
    },
  ];
  return <FirstStepsCard uid={user.id} steps={steps} />;
}

export function RecruiterFirstSteps() {
  const { user } = useApp();
  const orgId = user?.organizationRef;
  const { data: jobs, loading } = useCollection<Job>(orgId ? "jobs" : null, {
    where: orgId ? ["organizationRef", "==", orgId] : undefined,
  });
  if (!user || (orgId && loading)) return null;

  const steps: Step[] = [
    {
      id: "empresa",
      label: "Crea el perfil de tu empresa",
      hint: "Nombre, sitio web y descripción. Sin este paso no se pueden publicar vacantes.",
      href: "/dashboard/profile",
      done: !!orgId,
    },
    {
      id: "vacante",
      label: "Publica tu primera vacante",
      hint: "La IA puede redactar la descripción; tú la revisas y la corriges antes de publicar.",
      href: "/dashboard/jobs/new",
      done: (jobs ?? []).some((j) => j.status === "published"),
    },
  ];
  return (
    <FirstStepsCard
      uid={user.id}
      steps={steps}
      footer="Después, abre una vacante para ver a quienes se postulan, a los candidatos que la IA recomienda y para agendar entrevistas."
    />
  );
}
