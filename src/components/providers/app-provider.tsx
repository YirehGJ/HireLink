
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { users } from '@/lib/data';
import { app } from '@/lib/firebase'; // Import Firebase app

interface AppContextType {
  user: User | null;
  role: UserRole | null;
  setUser: (user: User | null) => void;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect now also ensures Firebase is initialized on the client
    const initFirebase = async () => {
      // You can use the `app` object here if needed, for example, for Analytics
    };
    initFirebase();
    
    try {
      const storedUser = localStorage.getItem('hirelink-user');
      if (storedUser) {
        setUserState(JSON.parse(storedUser));
      } else {
        // Default to first candidate if no user is stored
        setUserState(users.find(u => u.role === 'candidate')!);
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUserState(users.find(u => u.role === 'candidate')!);
    }
    setIsMounted(true);
  }, []);

  const handleSetUser = (newUser: User | null) => {
    if (newUser) {
      localStorage.setItem('hirelink-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('hirelink-user');
    }
    setUserState(newUser);
  };
  
  const role = useMemo(() => user?.role || null, [user]);

  const value = {
    user,
    role,
    setUser: handleSetUser,
    isMounted
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
