
"use client";

import { RecommendationCard } from './recommendation-card';
import { useApp } from '@/components/providers/app-provider';
import { useCollection, useDoc } from '@/firebase';
import type { Recommendation, Job } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function RecommendationCardLoader({ recommendation }: { recommendation: Recommendation }) {
  const { data: job } = useDoc<Job>(`jobs/${recommendation.jobRef}`);
  if (!job || job.status !== 'published') return null;
  return <RecommendationCard recommendation={recommendation} job={{ ...job, id: recommendation.jobRef }} />;
}

export function RecommendationFeed() {
  const { user } = useApp();
  // Se ordena en el cliente para no depender de un índice compuesto en Firestore.
  const { data: rawRecommendations, loading } = useCollection<Recommendation>(
    user ? 'recommendations' : null,
    { where: user ? ['candidateRef', '==', user.id] : undefined }
  );
  const recommendations = rawRecommendations
    ? [...rawRecommendations]
        .filter((r) => r.status !== 'rejected_by_candidate')
        .sort((a, b) => b.score - a.score)
    : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No hay recomendaciones por ahora</h3>
          <p className="text-muted-foreground mt-2">Asegúrate de que tu perfil y CV estén completos y actualizados.</p>
      </div>
      );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
      {recommendations.map(rec => (
        <RecommendationCardLoader key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}
