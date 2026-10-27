
"use client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { X } from "lucide-react"
import { useAuth, useCollection } from "@/firebase"
import { callAuthedApi } from "@/lib/api-client"
import { useApp } from "@/components/providers/app-provider"
import { useToast } from "@/hooks/use-toast"
import { toJsDate } from "@/lib/firestore-time"
import type { WhereClause } from "@/firebase/firestore/use-collection"
import type { Interview } from "@/lib/types"

const typeText: Record<Interview['type'], string> = {
    video: "Videollamada",
    phone: "Teléfono",
    onsite: "Presencial",
};

interface InterviewsCalendarProps {
    /** Entrevistas de una vacante (vista del reclutador). */
    jobId?: string;
    /**
     * Empresa dueña de la vacante. Las reglas de seguridad autorizan al reclutador por la empresa de
     * cada entrevista, así que la consulta debe fijarla (además de la vacante) o Firestore la rechaza.
     */
    organizationRef?: string;
    /** Entrevistas de un candidato (vista del candidato). */
    candidateUid?: string;
}

export function InterviewsCalendar({ jobId, organizationRef, candidateUid }: InterviewsCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    // Mientras la persona no elija un día, el calendario se abre en la próxima entrevista (antes abría siempre en hoy
    // y decía «no hay entrevistas» aunque hubiera para otro día).
    const [pickedByUser, setPickedByUser] = useState(false);
    // El mes que se ve se controla aparte: si la próxima entrevista cae en otro mes, el calendario se mueve a él.
    const [month, setMonth] = useState<Date>(new Date());
    const auth = useAuth();
    const { readOnly } = useApp();
    const { toast } = useToast();
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [toCancel, setToCancel] = useState<string | null>(null);

    const where: WhereClause | WhereClause[] | undefined = jobId
        ? (organizationRef
            ? [["jobRef", "==", jobId], ["organizationRef", "==", organizationRef]]
            : ["jobRef", "==", jobId])
        : candidateUid
            ? ["candidateRef", "==", candidateUid]
            : undefined;

    const { data, loading, error } = useCollection<Interview>(
        jobId || candidateUid ? "interviews" : null,
        { where }
    );

    const interviews = useMemo(
        () =>
            (data ?? [])
                .map(i => ({ ...i, start: toJsDate(i.scheduledStart as any) }))
                .filter(i => !Number.isNaN(i.start.getTime()))
                .sort((a, b) => a.start.getTime() - b.start.getTime()),
        [data]
    );

    useEffect(() => {
        if (pickedByUser || interviews.length === 0) return;
        // La próxima que no haya terminado; si todas son pasadas, la más reciente.
        const horizon = Date.now() - 3600_000;
        const next = interviews.find(i => i.start.getTime() >= horizon) ?? interviews[interviews.length - 1];
        setDate(next.start);
        setMonth(next.start);
    }, [interviews, pickedByUser]);

    const selectedDayInterviews = date
        ? interviews.filter(i => format(i.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        : [];

    async function cancel(id: string) {
        if (!auth) return;
        setCancelling(id);
        try {
            // El servidor elimina la entrevista, avisa al candidato y deja constancia en la auditoría.
            await callAuthedApi(auth, "/api/interviews/cancel", {
                interviewId: id,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            toast({ title: "Entrevista cancelada", description: "El candidato recibió un aviso." });
        } catch (e) {
            console.error(e);
            toast({ title: "No se pudo cancelar", variant: "destructive" });
        } finally {
            setCancelling(null);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
            <Card className="w-fit mx-auto md:mx-0">
                <CardContent className="p-3">
                   <Calendar
                        mode="single"
                        selected={date}
                        month={month}
                        onMonthChange={setMonth}
                        // Volver a tocar el día elegido lo deseleccionaba y el panel decía «Ningún día seleccionado»: se conserva.
                        onSelect={(d) => { setPickedByUser(true); if (d) setDate(d); }}
                        locale={es}
                        className="p-0"
                        modifiers={{
                            hasInterview: interviews.map(i => i.start)
                        }}
                        modifiersStyles={{
                            hasInterview: {
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                textDecorationColor: 'hsl(var(--secondary))'
                            }
                        }}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Entrevistas para</CardTitle>
                    <CardDescription>{date ? format(date, "PPP", { locale: es }) : 'Ningún día seleccionado'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Cargando…</p>
                    ) : error ? (
                        <p className="text-sm text-destructive-text text-center py-8" role="alert">
                            No se pudieron cargar las entrevistas. Recarga la página e inténtalo de nuevo.
                        </p>
                    ) : selectedDayInterviews.length > 0 ? (
                        selectedDayInterviews.map(interview => (
                            <div key={interview.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                                <div className="flex justify-between items-center gap-2">
                                    <p className="font-semibold">{candidateUid ? interview.jobTitle : interview.candidateName}</p>
                                    <div className="flex items-center gap-1">
                                        <Badge variant={interview.type === 'video' ? 'default' : 'secondary'}>{typeText[interview.type]}</Badge>
                                        {jobId && !readOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9"
                                                onClick={() => setToCancel(interview.id)}
                                                disabled={cancelling === interview.id}
                                                aria-label="Cancelar entrevista"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{format(interview.start, "HH:mm")}</p>
                                <p className="text-sm break-all">{interview.location}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No hay entrevistas agendadas para este día.</p>
                    )}
                    {!loading && !error && interviews.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {interviews.length} entrevista{interviews.length === 1 ? '' : 's'} en total (días subrayados).
                        </p>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={!!toCancel} onOpenChange={(open) => { if (!open) setToCancel(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar esta entrevista?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se elimina del calendario y la persona recibe un aviso de cancelación. El estado de su postulación no cambia.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { const id = toCancel; setToCancel(null); if (id) cancel(id); }}>
                            Cancelar entrevista
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
