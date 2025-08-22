'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/app-sidebar';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Clock, CreditCard, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';
import { createSubscription } from '@/lib/subscription/actions';

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

// Cache com TTL para evitar refetches desnecessários
const dataCache = {
  companyProfile: null as CompanyProfile | null,
  subscription: null as Subscription | null,
  lastFetch: 0,
  ttl: 5 * 60 * 1000, // 5 minutos
};

export default function AssinaturaGestaoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [annualLoading, setAnnualLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Verificar se os dados em cache ainda são válidos
  const isCacheValid = useMemo(() => {
    return Date.now() - dataCache.lastFetch < dataCache.ttl;
  }, []);

  // Carregar dados apenas se necessário
  const loadSubscriptionData = useCallback(async (forceRefresh = false) => {
    // Se não for refresh forçado e o cache for válido, usar dados em cache
    if (!forceRefresh && isCacheValid && dataCache.companyProfile && dataCache.subscription) {
      setCompanyProfile(dataCache.companyProfile);
      setSubscription(dataCache.subscription);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [profileResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/company/profile'),
        fetch('/api/subscription')
      ]);
      
      let newCompanyProfile = null;
      let newSubscription = null;

      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        newCompanyProfile = profileResult.data;
        setCompanyProfile(newCompanyProfile);
      }

      if (subscriptionResponse.ok) {
        const subscriptionResult = await subscriptionResponse.json();
        newSubscription = subscriptionResult.data;
        setSubscription(newSubscription);
      }

      // Atualizar cache
      dataCache.companyProfile = newCompanyProfile;
      dataCache.subscription = newSubscription;
      dataCache.lastFetch = Date.now();

    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
      toast.error('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  }, [isCacheValid]);

  // Carregar dados apenas uma vez quando o usuário estiver disponível
  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user, loadSubscriptionData]);

  const refreshData = async () => {
    await loadSubscriptionData(true); // Forçar refresh
    toast.success('Dados atualizados com sucesso!');
  };

  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    try {
      // Definir loading específico para o plano
      if (planType === 'monthly') {
        setMonthlyLoading(true);
      } else {
        setAnnualLoading(true);
      }

      const result = await createSubscription(planType);

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(result.error || 'Erro ao criar sessão de checkout');
      }
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar assinatura');
    } finally {
      // Limpar loading específico para o plano
      if (planType === 'monthly') {
        setMonthlyLoading(false);
      } else {
        setAnnualLoading(false);
      }
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
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-lg border bg-card p-6">
                    <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
                    <div className="h-8 w-32 bg-gray-100 rounded" />
                  </div>
                ))}
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

  // Labels dinâmicos do plano
  const planLabel = subscription?.plan_type === 'annual' ? 'Plano Anual' : 'Plano Mensal';
  const planPriceAmount = subscription?.plan_type === 'annual' ? 'R$ 979,00' : 'R$ 97,90';
  const planPriceSuffix = subscription?.plan_type === 'annual' ? '/ano' : '/mês';

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader 
            title="Gestão da Assinatura" 
            description="Gerencie sua assinatura e veja o status do seu período de teste"
          >
          </PageHeader>
          
            <div className="flex-1 space-y-6 p-6">
              {/* Card Principal - Status da Assinatura */}
              <Card className="border-2 overflow-hidden">
                <div className="bg-[linear-gradient(135deg,#ff6b35,#f7931e)] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-white text-xl font-semibold">Status da Assinatura</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">
                      {subscription ? getStatusText(subscription.status || '') : 'Trial'}
                    </Badge>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="text-white">
                      <div className="flex items-end gap-2">
                        <span className="text-[48px] leading-none font-extrabold">{planPriceAmount}</span>
                        <span className="text-white/90 text-lg mb-1">{planPriceSuffix}</span>
                      </div>
                      <div className="text-white/90 text-sm mt-1">{planLabel}</div>
                    </div>

                    {/* Ações removidas deste card para manter o portal apenas no card de Gerenciar Assinatura */}
                  </div>
                </div>
              </Card>

              {/* Card - Período de Teste (quando aplicável) */}
              {companyProfile?.status === 'trial' && (
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Período de Teste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Dias Restantes</p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`px-3 py-1 text-sm font-medium ${
                              trialDaysLeft > 3 
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : trialDaysLeft > 1
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`} 
                            variant="outline"
                          >
                            {trialDaysLeft} dias
                          </Badge>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            trialDaysLeft > 3 
                              ? 'bg-green-50 text-green-700'
                              : trialDaysLeft > 1
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {isTrialExpired ? 'Expirado' : 'Restantes'}
                          </span>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-600 mb-2">Progresso do Teste</p>
                        <Progress value={trialProgress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Início: {format(new Date(companyProfile.trial_start), 'dd/MM', { locale: ptBR })}</span>
                          <span>Fim: {format(new Date(companyProfile.trial_end), 'dd/MM', { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>

                    {isTrialExpired && (
                      <div className="mt-4">
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Seu período de teste expirou. Faça upgrade para continuar usando o sistema.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Planos de Assinatura */}
              {(!subscription || subscription.status === 'canceled' || subscription.status === 'unpaid') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Plano Mensal */}
                  <Card className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-center">Plano Mensal</CardTitle>
                      <CardDescription className="text-center">
                        Ideal para começar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <span className="text-3xl font-bold">R$ 97,90</span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                      
                      <ul className="text-sm text-gray-600 mb-6 space-y-2">
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Todos os recursos
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Suporte por email
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Cancelamento a qualquer momento
                        </li>
                      </ul>
                      
                      <Button 
                        onClick={() => {
                          console.log('🖱️ Botão Assinar Mensal clicado!');
                          handleSubscribe('monthly');
                        }}
                        disabled={monthlyLoading}
                        className="w-full"
                      >
                        {monthlyLoading ? 'Carregando...' : 'Assinar Mensal'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Plano Anual */}
                  <Card className="border-2 border-primary relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Mais Popular
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-center">Plano Anual</CardTitle>
                      <CardDescription className="text-center">
                        Economia de 2 meses
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <span className="text-3xl font-bold">R$ 979,00</span>
                        <span className="text-gray-600">/ano</span>
                        <div className="text-sm text-green-600 font-medium">
                          Economia de R$ 195,80
                        </div>
                      </div>
                      
                      <ul className="text-sm text-gray-600 mb-6 space-y-2">
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Todos os recursos
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Suporte prioritário
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          2 meses grátis
                        </li>
                      </ul>
                      
                      <Button 
                        onClick={() => {
                          console.log('🖱️ Botão Assinar Anual clicado!');
                          handleSubscribe('annual');
                        }}
                        disabled={annualLoading}
                        className="w-full"
                        variant="default"
                      >
                        {annualLoading ? 'Carregando...' : 'Assinar Anual'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

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
                          <ExternalLink className="mr-2 h-4 w-4 animate-spin" />
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
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    );
  } 