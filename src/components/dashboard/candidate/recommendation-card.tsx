import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Recommendation, Job } from "@/lib/types";
import { MapPin, Briefcase, Zap, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface RecommendationCardProps {
  recommendation: Recommendation;
  job: Job;
}

export function RecommendationCard({ recommendation, job }: RecommendationCardProps) {
  const { toast } = useToast();

  const handleApply = () => {
    toast({
        title: "¡Postulación enviada!",
        description: `Has aplicado exitosamente a la vacante de ${job.title}.`,
    });
  };
    
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-xl">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1.5" /> {job.location}</span>
                    <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 ml-2" /> {job.seniority}</span>
                </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="bg-accent/10 text-accent font-bold border-accent/20">
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
                {recommendation.reasons.slice(0, 3).map((reason, i) => (
                    <TooltipProvider key={i}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="cursor-default">
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
      <CardFooter>
        <Button className="w-full" onClick={handleApply}>Postularme ahora</Button>
      </CardFooter>
    </Card>
  );
}
