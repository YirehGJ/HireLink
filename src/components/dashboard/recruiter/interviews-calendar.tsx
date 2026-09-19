
"use client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { X } from "lucide-react"
import { useCollection, useFirestore } from "@/firebase"
import { interviewService } from "@/firebase/firestore/interview-service"
import { useApp } from "@/components/providers/app-provider"
import { useToast } from "@/hooks/use-toast"
import { toJsDate } from "@/lib/firestore-time"
import type { Interview } from "@/lib/types"

const typeText: Record<Interview['type'], string> = {
    video: "Videollamada",
    phone: "Teléfono",
    onsite: "Presencial",
};

interface InterviewsCalendarProps {
    /** Entrevistas de una vacante (vista del reclutador). */
    jobId?: string;
    /** Entrevistas de un candidato (vista del candidato). */
    candidateUid?: string;
}

export function InterviewsCalendar({ jobId, candidateUid }: InterviewsCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const firestore = useFirestore();
    const { readOnly } = useApp();
    const { toast } = useToast();

    const { data, loading } = useCollection<Interview>(
        jobId || candidateUid ? "interviews" : null,
        { where: jobId ? ["jobRef", "==", jobId] : ["candidateRef", "==", candidateUid] }
    );

    const interviews = useMemo(
        () =>
            (data ?? [])
                .map(i => ({ ...i, start: toJsDate(i.scheduledStart as any) }))
                .filter(i => !Number.isNaN(i.start.getTime()))
                .sort((a, b) => a.start.getTime() - b.start.getTime()),
        [data]
    );

    const selectedDayInterviews = date
        ? interviews.filter(i => format(i.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        : [];

    async function cancel(id: string) {
        if (!firestore) return;
        try {
            await interviewService.cancel(firestore, id);
            toast({ title: "Entrevista cancelada" });
        } catch (e) {
            console.error(e);
            toast({ title: "No se pudo cancelar", variant: "destructive" });
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                 <Card>
                    <CardContent className="p-0">
                       <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={es}
                            className="w-full p-0"
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
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Entrevistas para</CardTitle>
                        <CardDescription>{date ? format(date, "PPP", { locale: es }) : 'Ningún día seleccionado'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Cargando…</p>
                        ) : selectedDayInterviews.length > 0 ? (
                            selectedDayInterviews.map(interview => (
                                <div key={interview.id} className="p-3 bg-muted/50 rounded-lg space-y-1">
                                    <div className="flex justify-between items-center gap-2">
                                        <p className="font-semibold">{candidateUid ? interview.jobTitle : interview.candidateName}</p>
                                        <div className="flex items-center gap-1">
                                            <Badge variant={interview.type === 'video' ? 'default' : 'secondary'}>{typeText[interview.type]}</Badge>
                                            {jobId && !readOnly && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancel(interview.id)} aria-label="Cancelar entrevista">
                                                    <X className="h-3 w-3" />
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
                        {!loading && interviews.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {interviews.length} entrevista{interviews.length === 1 ? '' : 's'} en total (días subrayados).
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
