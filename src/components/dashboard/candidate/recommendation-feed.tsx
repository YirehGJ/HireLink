
"use client";

import { recommendations, getJob, candidates } from '@/lib/data';
import { RecommendationCard } from './recommendation-card';
import { useApp } from '@/components/providers/app-provider';

export function RecommendationFeed() {
  const { user } = useApp();
  const candidate = candidates.find(c => c.userRef === user?.id);
  const candidateRecs = candidate ? recommendations.filter(r => r.candidateRef === candidate.id) : [];
  
  if (candidateRecs.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No hay recomendaciones por ahora</h3>
          <p className="text-muted-foreground mt-2">Asegúrate de que tu perfil y CV estén completos y actualizados.</p>
      </div>
      );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
      {candidateRecs.map(rec => {
          const job = getJob(rec.jobRef);
          if (!job) return null;
          return <RecommendationCard key={rec.id} recommendation={rec} job={job} />;
      })}
    </div>
  );
}
