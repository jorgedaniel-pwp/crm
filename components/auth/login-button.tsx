'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';

export function LoginButton() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={login} variant="default" size="sm">
        <LogIn className="mr-2 h-4 w-4" />
        Sign in with Microsoft
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {user?.name || user?.username || 'User'}
      </span>
      <Button onClick={logout} variant="ghost" size="sm">
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}