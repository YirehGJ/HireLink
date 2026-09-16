
"use client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { addDays, format } from "date-fns"

const interviews = [
    { date: addDays(new Date(), 2), time: "10:00 AM", candidate: "Alex Doe", type: "video" },
    { date: addDays(new Date(), 2), time: "02:00 PM", candidate: "Devon Ray", type: "phone" },
    { date: addDays(new Date(), 5), time: "11:30 AM", candidate: "Casey Jones", type: "onsite" },
];

export function InterviewsCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())

    const selectedDayInterviews = date ? interviews.filter(
        interview => format(interview.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ) : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                 <Card>
                    <CardContent className="p-0">
                       <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="w-full p-0"
                            modifiers={{
                                // @ts-ignore
                                hasInterview: interviews.map(i => i.date)
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
                        <CardDescription>{date ? format(date, "PPP") : 'Ningún día seleccionado'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedDayInterviews.length > 0 ? (
                            selectedDayInterviews.map((interview, index) => (
                                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{interview.candidate}</p>
                                        <Badge variant={interview.type === 'video' ? 'default' : 'secondary'} className="capitalize">{interview.type}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{interview.time}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No hay entrevistas agendadas para este día.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
