'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AuthDebug } from '@/components/auth-debug';

export default function TestAuthPage() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p>
                <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
              </p>
              <p>
                <strong>Usuário:</strong> {user ? user.email : 'Nenhum'}
              </p>
              <p>
                <strong>Sessão:</strong> {session ? 'Ativa' : 'Nenhuma'}
              </p>
              <p>
                <strong>User ID:</strong> {user?.id || 'N/A'}
              </p>
              <p>
                <strong>Email Confirmado:</strong>{' '}
                {user?.email_confirmed_at ? 'Sim' : 'Não'}
              </p>
              <p>
                <strong>Último Login:</strong>{' '}
                {user?.last_sign_in_at || 'Nunca'}
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={() => router.push('/')} className="w-full">
                Ir para Dashboard
              </Button>

              <Button
                onClick={() => router.push('/configuracoes')}
                className="w-full"
                variant="outline"
              >
                Ir para Configurações
              </Button>

              <Button
                onClick={handleLogout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Component */}
      <AuthDebug />
    </div>
  );
}
