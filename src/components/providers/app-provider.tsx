
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useUser, useDoc } from '@/firebase';

const VIEW_AS_KEY = 'hirelink:viewAs';

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  role: UserRole | null;
  isMounted: boolean;
  /** true cuando un admin está viendo la app como otro usuario (solo lectura). */
  readOnly: boolean;
  startViewAs: (uid: string) => void;
  stopViewAs: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const [userState, setUserState] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewAsUid, setViewAsUid] = useState<string | null>(null);

  const userDocPath = firebaseUser ? `users/${firebaseUser.uid}` : null;
  const { data: userFromFirestore, loading: userLoading } = useDoc<User>(userDocPath);

  useEffect(() => {
    setIsMounted(true);
    try {
      setViewAsUid(sessionStorage.getItem(VIEW_AS_KEY));
    } catch {
      /* sessionStorage no disponible */
    }
  }, []);

  useEffect(() => {
    if (userFromFirestore) {
      setUserState(userFromFirestore);
    } else if (!authLoading && !userLoading && !firebaseUser) {
      setUserState(null);
    }
  }, [userFromFirestore, authLoading, userLoading, firebaseUser]);

  // "Ver como": solo un admin real puede asumir la vista de otro usuario, y siempre en solo lectura.
  const impersonating = userState?.role === 'admin' && !!viewAsUid && viewAsUid !== userState.id;
  const { data: viewedUser, loading: viewedLoading } = useDoc<User>(
    impersonating ? `users/${viewAsUid}` : null
  );

  const startViewAs = useCallback((uid: string) => {
    try { sessionStorage.setItem(VIEW_AS_KEY, uid); } catch { /* noop */ }
    setViewAsUid(uid);
  }, []);

  const stopViewAs = useCallback(() => {
    try { sessionStorage.removeItem(VIEW_AS_KEY); } catch { /* noop */ }
    setViewAsUid(null);
  }, []);

  const effectiveUser: User | null =
    impersonating && viewedUser ? { ...viewedUser, id: viewAsUid! } : userState;

  const role = useMemo(() => effectiveUser?.role || null, [effectiveUser]);
  const loading = authLoading || userLoading || (impersonating && viewedLoading);

  const value: AppContextType = {
    user: effectiveUser,
    setUser: setUserState,
    role,
    isMounted: isMounted && !loading,
    readOnly: impersonating && !!viewedUser,
    startViewAs,
    stopViewAs,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
