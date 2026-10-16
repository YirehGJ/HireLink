
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/lib/types";
import { MapPin, Briefcase, Mail } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { seniorityLabel, yearsLabel } from "@/lib/format";

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const skills = candidate.skills ?? [];
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <UserAvatar
          name={candidate.fullName || candidate.headline}
          seed={candidate.id}
          className="h-24 w-24 mb-4 border-4 border-primary/20 text-2xl"
        />
        <CardTitle className="font-headline text-xl text-primary dark:text-primary-foreground/90">{candidate.fullName || candidate.headline}</CardTitle>
        {candidate.fullName && <p className="text-sm text-muted-foreground mt-1">{candidate.headline}</p>}
        <CardDescription className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            {candidate.location && <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {candidate.location}</span>}
            <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 ml-2" /> {yearsLabel(candidate.yearsOfExperience)} de exp.</span>
        </CardDescription>
        {candidate.targetSeniority && (
            <Badge variant="outline" className="mt-2">Busca: {seniorityLabel(candidate.targetSeniority)}</Badge>
        )}

        <div className="mt-4 w-full">
            <div className="flex flex-wrap gap-2 justify-center">
                {skills.slice(0, 4).map((skill, i) => (
                    <Badge key={`${skill.name}-${i}`} variant="lilac">
                        {skill.name}
                    </Badge>
                ))}
                {skills.length > 4 && <Badge variant="outline">+{skills.length - 4}</Badge>}
            </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        {candidate.email ? (
          <Button className="w-full" asChild>
            <a href={`mailto:${candidate.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              Contactar
            </a>
          </Button>
        ) : (
          <Button className="w-full" disabled title="El candidato aún no ha actualizado su perfil">
            <Mail className="mr-2 h-4 w-4" />
            Sin correo disponible
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
