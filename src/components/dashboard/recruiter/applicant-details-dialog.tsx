"use client";

import * as React from "react";
import { CalendarPlus, Loader2, Mail, MapPin, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useFirestore } from "@/firebase";
import { applicationService } from "@/firebase/firestore/application-service";
import { interviewService } from "@/firebase/firestore/interview-service";
import { callAuthedApi } from "@/lib/api-client";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/hooks/use-toast";
import type { Application, Candidate, InterviewType, Recommendation } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: Application;
  candidate: Candidate | null | undefined;
  recommendation?: Recommendation;
  job: { id: string; title: string; organizationRef: string };
}

/**
 * Detalle del postulante para el reclutador: perfil, razones de la IA, notas
 * privadas, contacto y agenda de entrevista (S08 + S10).
 */
export function ApplicantDetailsDialog({ open, onOpenChange, app, candidate, recommendation, job }: Props) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { readOnly } = useApp();

  const [notes, setNotes] = React.useState(app.recruiterNotes ?? "");
  const [savingNotes, setSavingNotes] = React.useState(false);

  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("10:00");
  const [type, setType] = React.useState<InterviewType>("video");
  const [place, setPlace] = React.useState("");
  const [scheduling, setScheduling] = React.useState(false);

  React.useEffect(() => {
    setNotes(app.recruiterNotes ?? "");
  }, [app.recruiterNotes]);

  const name = candidate?.fullName || candidate?.headline || "Candidato";

  async function saveNotes() {
    if (!firestore) return;
    setSavingNotes(true);
    try {
      await applicationService.updateRecruiterFields(firestore, job.id, app.id, { recruiterNotes: notes });
      toast({ title: "Notas guardadas" });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudieron guardar las notas", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  }

  async function schedule() {
    if (!firestore || !auth?.currentUser) return;
    const start = new Date(`${date}T${time}`);
    if (!date || Number.isNaN(start.getTime())) {
      toast({ title: "Elige una fecha y hora válidas", variant: "destructive" });
      return;
    }
    if (!place.trim()) {
      toast({ title: type === "video" ? "Agrega el enlace de la videollamada" : "Agrega el lugar o teléfono", variant: "destructive" });
      return;
    }
    setScheduling(true);
    try {
      await interviewService.schedule(firestore, {
        jobRef: job.id,
        jobTitle: job.title,
        organizationRef: job.organizationRef,
        candidateRef: app.candidateRef,
        candidateName: name,
        interviewerRef: auth.currentUser.uid,
        type,
        scheduledStart: start,
        location: place.trim(),
      });
      await applicationService.updateStatus(firestore, job.id, app.id, "interview");
      // Notifica al candidato y deja constancia en la auditoría.
      await callAuthedApi(auth, "/api/applications/notify-status", {
        jobId: job.id,
        candidateUid: app.candidateRef,
        newStatus: "interview",
        interviewAt: start.toISOString(),
        interviewType: type,
      });
      toast({ title: "Entrevista agendada", description: "El candidato recibió una notificación." });
      setDate("");
      setPlace("");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo agendar la entrevista", variant: "destructive" });
    } finally {
      setScheduling(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{candidate?.headline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {candidate?.location && (
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" />{candidate.location}</span>
            )}
            <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5" />{candidate?.yearsOfExperience ?? 0} años exp.</span>
            {candidate?.email && (
              <a className="flex items-center text-primary hover:underline" href={`mailto:${candidate.email}`}>
                <Mail className="h-4 w-4 mr-1.5" />{candidate.email}
              </a>
            )}
          </div>

          {recommendation && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <Zap className="h-4 w-4" /> Compatibilidad IA: {(recommendation.score * 100).toFixed(0)}%
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendation.reasons.map((r, i) => (
                  <Badge key={i} variant="lilac">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2">Habilidades</h4>
            <div className="flex flex-wrap gap-2">
              {(candidate?.skills ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sin habilidades registradas.</p>
              )}
              {(candidate?.skills ?? []).map((s, i) => (
                <Badge key={i} variant="secondary">{s.name} · {s.level}/5</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas privadas del reclutador</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={readOnly} placeholder="Impresiones, seguimiento, puntos por validar…" />
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes || readOnly}>
              {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar notas
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="text-sm font-semibold flex items-center gap-2"><CalendarPlus className="h-4 w-4" />Agendar entrevista</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="int-date">Fecha</Label>
                <Input id="int-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="int-time">Hora</Label>
                <Input id="int-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Videollamada</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="onsite">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="int-place">{type === "video" ? "Enlace de la videollamada" : type === "phone" ? "Teléfono" : "Dirección"}</Label>
              <Input id="int-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={type === "video" ? "https://meet.google.com/…" : ""} />
            </div>
            <Button onClick={schedule} disabled={scheduling || readOnly}>
              {scheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Agendar y notificar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
