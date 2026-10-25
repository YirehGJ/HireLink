
"use client";

import * as React from 'react';
import { RecommendationCard } from './recommendation-card';
import { useApp } from '@/components/providers/app-provider';
import { useCollection } from '@/firebase';
import type { Recommendation, Job } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MATCH_THRESHOLD } from '@/lib/constants';

export function RecommendationFeed() {
  const { user } = useApp();
  // Se ordena en el cliente para no depender de un índice compuesto en Firestore.
  const { data: rawRecommendations, loading } = useCollection<Recommendation>(
    user ? 'recommendations' : null,
    { where: user ? ['candidateRef', '==', user.id] : undefined }
  );
  // Un único listener con las vacantes publicadas (en vez de uno por recomendación).
  const { data: publishedJobs, loading: jobsLoading } = useCollection<Job>(
    user ? 'jobs' : null,
    { where: user ? ['status', '==', 'published'] : undefined }
  );

  const items = React.useMemo(() => {
    const jobById = new Map((publishedJobs ?? []).map((j) => [j.id, j]));
    return (rawRecommendations ?? [])
      // Solo matches con una afinidad relevante (el mismo umbral que ve la empresa), que sigan abiertos
      // y que el candidato no haya rechazado.
      .filter((r) => r.score >= MATCH_THRESHOLD && r.status !== 'rejected_by_candidate')
      .filter((r) => jobById.has(r.jobRef))
      .sort((a, b) => b.score - a.score)
      .map((r) => ({ rec: r, job: jobById.get(r.jobRef)! }));
  }, [rawRecommendations, publishedJobs]);

  if (loading || jobsLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h2 className="text-xl font-semibold">No hay recomendaciones por ahora</h2>
        <p className="text-muted-foreground mt-2">
          Se calculan al guardar tu perfil (con tus habilidades y tu CV) y cuando se publican vacantes nuevas. Si acabas de
          guardarlo y no aparece nada, puede que la IA haya alcanzado su límite del día: inténtalo más tarde o explora todas las vacantes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
      {items.map(({ rec, job }) => (
        <RecommendationCard key={rec.id} recommendation={rec} job={job} />
      ))}
    </div>
  );
}
