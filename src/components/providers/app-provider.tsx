
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useUser, useDoc } from '@/firebase';
import { users } from '@/lib/data';

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  role: UserRole | null;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);


function AppProviderContent({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useUser();
  const [userState, setUserState] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const searchParams = useSearchParams();
  const viewAs = searchParams.get('viewAs');

  const userDocPath = firebaseUser ? `users/${firebaseUser.uid}` : '';
  const { data: userFromFirestore, loading: userLoading } = useDoc<User>(userDocPath);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Bypass auth for demo mode
    if (viewAs) {
      const demoUser = users.find(u => u.role === viewAs);
      if (demoUser) {
        setUserState(demoUser);
        return; // In demo mode, don't proceed with firebase auth
      }
    }
    
    // Regular auth flow
    if (userFromFirestore) {
      setUserState(userFromFirestore);
    } else if (!authLoading && !userLoading && !firebaseUser) {
      // Clear user state on logout or if no user is found
      setUserState(null);
    }
  }, [userFromFirestore, viewAs, authLoading, userLoading, firebaseUser]);


  const role = useMemo(() => userState?.role || null, [userState]);

  // In demo mode, we don't care about firebase loading states
  const loading = viewAs ? false : (authLoading || userLoading);

  const value = {
    user: userState,
    setUser: setUserState,
    role,
    isMounted: isMounted && !loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AppProviderContent>{children}</AppProviderContent>
    </Suspense>
  )
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
