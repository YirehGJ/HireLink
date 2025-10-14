
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { useUser, useDoc } from '@/firebase'; // Import the new useUser and useDoc hooks

interface AppContextType {
  user: User | null;
  role: UserRole | null;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  // Get the user profile from Firestore using the authenticated user's UID
  const userDocPath = firebaseUser ? `users/${firebaseUser.uid}` : '';
  const { data: user, loading: userLoading } = useDoc<User>(userDocPath);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const role = useMemo(() => user?.role || null, [user]);

  const loading = authLoading || userLoading;

  const value = {
    user: user || null,
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

    