'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';

interface UserProfile {
  displayName?: string;
  email?: string;
  role?: string;
  bio?: string;
  [key: string]: any;
}

export function ProfileClient() {
  const { user, loading: authLoading } = useUser();
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  if (authLoading || profileLoading) return <div>Cargando...</div>;
  if (!user) return <div>Inicia sesión.</div>;
  if (!profile) return <div>Perfil vacío.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Perfil</h1>
      <div className="rounded border p-4">
        <p><strong>Nombre:</strong> {profile.displayName || '—'}</p>
        <p><strong>Email:</strong> {profile.email || user.email || '—'}</p>
        <p><strong>Rol:</strong> {profile.role || '—'}</p>
        <p><strong>Bio:</strong> {profile.bio || '—'}</p>
      </div>
      <h2 className="text-lg font-medium">JSON</h2>
      <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto">
{JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  );
}