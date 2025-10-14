
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useUser, useDoc } from '@/firebase';

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  role: UserRole | null;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const [userState, setUserState] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const userDocPath = firebaseUser ? `users/${firebaseUser.uid}` : '';
  const { data: userFromFirestore, loading: userLoading } = useDoc<User>(userDocPath);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (userFromFirestore) {
      setUserState(userFromFirestore);
    }
  }, [userFromFirestore]);

  const role = useMemo(() => userState?.role || null, [userState]);

  const loading = authLoading || userLoading;

  const value = {
    user: userState,
    setUser: setUserState,
    role,
    isMounted: isMounted && !loading,
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
