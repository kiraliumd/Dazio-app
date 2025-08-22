'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AuthGuard } from '@/components/auth-guard';

export default function AssinaturaCancelPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/assinatura-gestao');
  };

  const handleTryAgain = () => {
    router.push('/assinatura-gestao');
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader
            title="Assinatura Cancelada"
            description="O processo de assinatura foi cancelado"
          />

          <div className="flex-1 space-y-6 p-6">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <XCircle className="h-12 w-12 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-orange-800">
                  Assinatura Cancelada
                </CardTitle>
                <CardDescription className="text-orange-700">
                  O processo de assinatura foi cancelado ou não foi concluído
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-orange-700">
                    Não se preocupe! Você pode tentar novamente a qualquer
                    momento.
                  </p>
                  <p className="text-sm text-orange-600">
                    Sua conta continua funcionando normalmente no período de
                    teste
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleGoBack}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>

                  <Button
                    onClick={handleTryAgain}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>

                <div className="text-xs text-orange-600">
                  <p>• Sua conta continua no período de teste</p>
                  <p>• Nenhum valor foi cobrado</p>
                  <p>• Você pode tentar novamente quando quiser</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
