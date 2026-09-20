import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recommendation, Job } from "@/lib/types";
import { MapPin, Briefcase, Zap, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApplyButton } from "./apply-button";
import { RejectMatchButton } from "./reject-match-button";
import { MATCH_THRESHOLD } from "@/lib/constants";

interface RecommendationCardProps {
  recommendation: Recommendation;
  job: Job;
}

export function RecommendationCard({ recommendation, job }: RecommendationCardProps) {

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-xl text-primary dark:text-primary-foreground/90">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {job.location}</span>
                    <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 ml-2" /> {job.seniority}</span>
                </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="font-bold">
                      <Zap className="h-3 w-3 mr-1" />
                      {(recommendation.score * 100).toFixed(0)}% Match
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Este puntaje representa la afinidad con tu perfil.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">{job.descriptionMd}</p>
        <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-foreground">Razones Principales</h4>
            <div className="flex flex-wrap gap-2">
                {recommendation.reasons.map((reason, i) => (
                    <TooltipProvider key={i}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="lilac" className="cursor-default">
                                    <CheckCircle className="h-3 w-3 mr-1.5 text-green-500"/>
                                    {reason}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Tu perfil coincide con este requisito de la vacante.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-stretch">
        {recommendation.score >= MATCH_THRESHOLD && (
          <Badge variant={recommendation.status === "accepted" ? "default" : "outline"} className="self-start">
            {recommendation.status === "accepted"
              ? "¡La empresa aceptó tu match!"
              : recommendation.status === "rejected_by_recruiter"
                ? "La empresa no avanzó con este match"
                : "Match en espera de la empresa"}
          </Badge>
        )}
        <ApplyButton job={job} className="w-full" />
        <RejectMatchButton recommendationId={recommendation.id} jobTitle={job.title} />
      </CardFooter>
    </Card>
  );
}
