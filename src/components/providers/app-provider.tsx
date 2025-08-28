"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { users } from '@/lib/data';

interface AppContextType {
  user: User;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const mockUsers: Record<UserRole, User> = {
    candidate: users.find(u => u.role === 'candidate')!,
    recruiter: users.find(u => u.role === 'recruiter')!,
    admin: users.find(u => u.role === 'admin')!,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('candidate');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('hirelink-role') as UserRole;
    if (storedRole && ['candidate', 'recruiter', 'admin'].includes(storedRole)) {
      setRole(storedRole);
    }
    setIsMounted(true);
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    localStorage.setItem('hirelink-role', newRole);
    setRole(newRole);
  };

  const user = useMemo(() => mockUsers[role], [role]);

  const value = {
    user,
    role,
    setRole: handleSetRole,
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
