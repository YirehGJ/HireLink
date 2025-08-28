import Link from "next/link";
import { jobs, applications } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";

export function JobsList() {
  const recruiterJobs = jobs.filter(j => j.organizationRef === 'org-1');
  
  if (recruiterJobs.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No tienes vacantes creadas</h3>
              <p className="text-muted-foreground mt-2">¡Crea tu primera vacante para empezar a reclutar!</p>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {recruiterJobs.map(job => {
        const jobApps = applications.filter(app => app.jobRef === job.id);
        const statusText = job.status.charAt(0).toUpperCase() + job.status.slice(1);

        return (
            <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="font-headline text-lg text-primary dark:text-primary-foreground/90">{job.title}</CardTitle>
                        <Badge variant={job.status === 'published' ? 'secondary' : 'outline'}>
                            {statusText}
                        </Badge>
                    </div>
                    <CardDescription>{job.location} | {job.seniority}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{jobApps.length} aplicantes</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href={`/dashboard/jobs/${job.id}`}>
                            Gestionar Vacante
                            <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    })}
    </div>
  );
}
