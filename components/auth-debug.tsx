'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AuthDebug() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        user: user ? {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at,
          lastSignIn: user.last_sign_in_at,
        } : null,
        session: session ? {
          accessToken: session.access_token ? 'Present' : 'Missing',
          refreshToken: session.refresh_token ? 'Present' : 'Missing',
          expiresAt: session.expires_at,
        } : null,
        loading,
        localStorage: {
          pendingEmail: localStorage.getItem('pendingEmail'),
          supabaseAuth: localStorage.getItem('dazio-auth'),
        }
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [user, session, loading]);

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Auth Debug
          <Badge variant={user ? "default" : "destructive"}>
            {user ? 'Logged In' : 'Not Logged In'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>User:</strong> {user?.email || 'None'}
        </div>
        <div>
          <strong>Session:</strong> {session ? 'Active' : 'None'}
        </div>
        <div>
          <strong>Email Confirmed:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Last Sign In:</strong> {user?.last_sign_in_at || 'Never'}
        </div>
        <div>
          <strong>Access Token:</strong> {debugInfo.session?.accessToken || 'N/A'}
        </div>
        <div>
          <strong>Refresh Token:</strong> {debugInfo.session?.refreshToken || 'N/A'}
        </div>
        <div>
          <strong>Session Expires:</strong> {debugInfo.session?.expiresAt || 'N/A'}
        </div>
        <div>
          <strong>Pending Email:</strong> {debugInfo.localStorage?.pendingEmail || 'None'}
        </div>
        <div>
          <strong>Supabase Auth:</strong> {debugInfo.localStorage?.supabaseAuth ? 'Present' : 'None'}
        </div>
        <div>
          <strong>Timestamp:</strong> {debugInfo.timestamp}
        </div>
        
        <div className="pt-2 space-y-1">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearStorage}
            className="w-full"
          >
            Clear Storage & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 