'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AssinaturaSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Session ID recebido:', sessionIdParam);
      }
    }
    setLoading(false);
  }, [searchParams]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToSubscription = () => {
    router.push('/assinatura-gestao');
  };

  if (loading) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <PageHeader
              title="Processando Assinatura"
              description="Aguarde enquanto processamos sua assinatura..."
            />
            <div className="flex-1 space-y-6 p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader
            title="Assinatura Realizada com Sucesso!"
            description="Parabéns! Sua assinatura foi ativada com sucesso"
          />

          <div className="flex-1 space-y-6 p-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-green-800">
                  Assinatura Ativada!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Sua assinatura foi processada com sucesso e está ativa
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-green-700">
                    <strong>Session ID:</strong> {sessionId || 'N/A'}
                  </p>
                  <p className="text-sm text-green-600">
                    Este ID pode ser usado para referência em caso de dúvidas
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleGoToDashboard}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Ir para Dashboard
                  </Button>

                  <Button
                    onClick={handleGoToSubscription}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Gerenciar Assinatura
                  </Button>
                </div>

                <div className="text-xs text-green-600">
                  <p>• Sua assinatura está ativa e funcionando</p>
                  <p>• Você receberá um email de confirmação</p>
                  <p>
                    • O webhook do Stripe atualizou seu status automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
