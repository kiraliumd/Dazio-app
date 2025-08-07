'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Calendar, Clock, CreditCard, AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createSubscription } from '@/lib/subscription/actions';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';
import { TrialWrapper } from '@/components/trial-wrapper';

interface CompanyProfile {
  id: string;
  company_name: string;
  trial_start: string;
  trial_end: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
}

interface Subscription {
  id: string;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | undefined;
  current_period_end: string;
  trial_end: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
}

export default function AssinaturaGestaoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Assinatura Gestão: Carregando dados da assinatura');
      
      // Testar autenticação primeiro
      const authResponse = await fetch('/api/test-auth');
      const authResult = await authResponse.json();
      console.log('🔍 Assinatura Gestão: Teste de autenticação:', authResult);
      
      if (!authResponse.ok) {
        console.error('❌ Assinatura Gestão: Falha na autenticação:', authResult);
        toast.error('Erro de autenticação. Por favor, faça login novamente.');
        return;
      }
      
      const profileResponse = await fetch('/api/company/profile');
      const profileResult = await profileResponse.json();
      console.log('🔍 Assinatura Gestão: Resposta do perfil:', profileResult);
      
      if (profileResponse.ok) {
        setCompanyProfile(profileResult.data);
      } else {
        console.error('❌ Assinatura Gestão: Erro ao carregar perfil:', profileResult);
      }

      const subscriptionResponse = await fetch('/api/subscription');
      const subscriptionResult = await subscriptionResponse.json();
      console.log('🔍 Assinatura Gestão: Resposta da assinatura:', subscriptionResult);
      
      if (subscriptionResponse.ok) {
        setSubscription(subscriptionResult.data);
      } else {
        console.error('❌ Assinatura Gestão: Erro ao carregar assinatura:', subscriptionResult);
      }

    } catch (error) {
      console.error('❌ Assinatura Gestão: Erro ao carregar dados da assinatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    try {
      setCheckoutLoading(true);
      
      const result = await createSubscription(planType);
      
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(result.error || 'Erro ao criar sessão de checkout');
      }
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      toast.error('Erro ao iniciar assinatura');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const result = await fetch('/api/subscription/portal', {
        method: 'POST',
      }).then(res => res.json());

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Erro ao acessar portal do cliente');
      }
    } catch (error) {
      console.error('Erro ao acessar portal:', error);
      toast.error('Erro ao acessar portal do cliente');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'canceled':
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'trialing':
        return 'Em Teste';
      case 'past_due':
        return 'Pagamento Pendente';
      case 'canceled':
        return 'Cancelada';
      case 'unpaid':
        return 'Não Paga';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <PageHeader 
              title="Gestão da Assinatura" 
              description="Carregando dados da assinatura..."
            />
            <div className="flex-1 space-y-6 p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados da assinatura...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  }

  const trialEndDate = companyProfile?.trial_end ? new Date(companyProfile.trial_end) : null;
  const isTrialExpired = trialEndDate ? isAfter(new Date(), trialEndDate) : false;
  const trialDaysLeft = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;
  const trialProgress = companyProfile?.trial_start && trialEndDate 
    ? Math.max(0, Math.min(100, ((7 - trialDaysLeft) / 7) * 100))
    : 0;

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader 
            title="Gestão da Assinatura" 
            description="Gerencie sua assinatura e veja o status do seu período de teste"
          />
          
          <TrialWrapper>
            <div className="flex-1 space-y-6 p-6">
              {/* Status Geral */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status da Assinatura */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Status da Assinatura
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Badge 
                        className={`mb-3 ${getStatusColor(subscription?.status || 'trial')}`}
                        variant="outline"
                      >
                        {subscription ? getStatusText(subscription.status || '') : 'Trial'}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {subscription?.plan_type === 'annual' ? 'Plano Anual' : subscription?.plan_type === 'monthly' ? 'Plano Mensal' : 'Período de Teste'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Próximo Pagamento */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Próximo Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {subscription?.current_period_end 
                          ? format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {subscription?.plan_type === 'annual' ? 'Renovação Anual' : subscription?.plan_type === 'monthly' ? 'Renovação Mensal' : 'Fim do Trial'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Valor */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Valor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {subscription?.plan_type === 'annual' ? '979,00' : subscription?.plan_type === 'monthly' ? '97,90' : '0,00'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {subscription?.plan_type === 'annual' ? '/ano' : subscription?.plan_type === 'monthly' ? '/mês' : 'Gratuito'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trial Status */}
              {companyProfile?.status === 'trial' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Período de Teste
                    </CardTitle>
                    <CardDescription>
                      {isTrialExpired 
                        ? 'Seu período de teste expirou. Faça upgrade para continuar.'
                        : `Restam ${trialDaysLeft} dias no seu período de teste`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Início: {format(new Date(companyProfile.trial_start), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span>Fim: {format(new Date(companyProfile.trial_end), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      
                      <Progress value={trialProgress} className="h-2" />
                      
                      {isTrialExpired && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Seu período de teste expirou. Faça upgrade para continuar usando o sistema.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Debug - Botão de Teste */}
              <Card>
                <CardHeader>
                  <CardTitle>Debug - Teste de Autenticação</CardTitle>
                  <CardDescription>
                    Teste a autenticação e veja os logs no console
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={loadSubscriptionData}
                    className="w-full"
                    variant="outline"
                  >
                    🔍 Testar Autenticação e Carregar Dados
                  </Button>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gerenciar Assinatura */}
                {subscription && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerenciar Assinatura</CardTitle>
                      <CardDescription>
                        Acesse o portal do Stripe para gerenciar pagamentos, cancelamentos e métodos de pagamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleManageSubscription}
                        disabled={portalLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {portalLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Acessar Portal do Cliente
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Fazer Upgrade */}
                {(!subscription || subscription.status === 'canceled' || subscription.status === 'unpaid') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Fazer Upgrade</CardTitle>
                      <CardDescription>
                        Escolha um plano para continuar usando todos os recursos do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={() => handleSubscribe('monthly')}
                        disabled={checkoutLoading}
                        className="w-full"
                      >
                        {checkoutLoading ? 'Carregando...' : 'Assinar Plano Mensal - R$ 97,90/mês'}
                      </Button>
                      
                      <Button 
                        onClick={() => handleSubscribe('annual')}
                        disabled={checkoutLoading}
                        className="w-full"
                        variant="outline"
                      >
                        {checkoutLoading ? 'Carregando...' : 'Assinar Plano Anual - R$ 979,00/ano (2 meses grátis)'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              
            </div>
          </TrialWrapper>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
} 