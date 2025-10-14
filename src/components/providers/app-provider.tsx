
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { users } from '@/lib/data';
import { useUser } from '@/firebase'; // Import the new useUser hook

interface AppContextType {
  user: User | null; // This will eventually be the Firebase User object
  role: UserRole | null;
  // setUser: (user: User | null) => void; // This will be handled by Firebase Auth
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // const [user, setUserState] = useState<User | null>(null);
  const { user: firebaseUser, loading } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  // TODO: This logic will be replaced with fetching user profile from Firestore
  const user: User | null = useMemo(() => {
    if (firebaseUser) {
      // For now, find the mock user that matches the logged-in Firebase user's email
      // In the future, this will be a Firestore document fetch
      return users.find(u => u.email === firebaseUser.email) || null;
    }
    // For local dev without auth, default to first candidate
    if (process.env.NODE_ENV === 'development' && !firebaseUser && !loading) {
       return users.find(u => u.role === 'candidate') || null;
    }
    return null;
  }, [firebaseUser, loading]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const role = useMemo(() => user?.role || null, [user]);

  const value = {
    user,
    role,
    // setUser is removed as Firebase will handle it
    isMounted: isMounted && !loading
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
