
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/lib/types";
import { MapPin, Briefcase, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
            <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${candidate.id}/200/200`} />
            <AvatarFallback>{(candidate.fullName || candidate.headline || '?').charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline text-xl text-primary dark:text-primary-foreground/90">{candidate.fullName || candidate.headline}</CardTitle>
        {candidate.fullName && <p className="text-sm text-muted-foreground mt-1">{candidate.headline}</p>}
        <CardDescription className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {candidate.location}</span>
            <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 ml-2" /> {candidate.yearsOfExperience} años exp.</span>
        </CardDescription>
        
        <div className="mt-4 w-full">
            <div className="flex flex-wrap gap-2 justify-center">
                {(candidate.skills ?? []).slice(0, 4).map((skill, i) => (
                    <Badge key={i} variant="lilac">
                        {skill.name}
                    </Badge>
                ))}
                {(candidate.skills?.length ?? 0) > 4 && <Badge variant="outline">+{candidate.skills.length - 4}</Badge>}
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
