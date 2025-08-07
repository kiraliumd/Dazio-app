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
import { Calendar, Clock, CreditCard, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Star, Zap, Crown } from 'lucide-react';
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
      
      const [profileResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/company/profile'),
        fetch('/api/subscription')
      ]);
      
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        setCompanyProfile(profileResult.data);
      }

      if (subscriptionResponse.ok) {
        const subscriptionResult = await subscriptionResponse.json();
        setSubscription(subscriptionResult.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados da assinatura:', error);
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

              {/* Seção de Preços */}
              {(!subscription || subscription.status === 'canceled' || subscription.status === 'unpaid') && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu Plano</h2>
                    <p className="text-lg text-gray-600">Desbloqueie todo o potencial do Dazio</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plano Mensal */}
                    <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                      <CardHeader className="text-center pb-4">
                        <div className="flex items-center justify-center mb-2">
                          <Zap className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Plano Mensal</CardTitle>
                        <CardDescription>Ideal para começar</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900">R$ 97,90</div>
                          <div className="text-gray-600">por mês</div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Acesso completo ao sistema</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Suporte por email</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Atualizações gratuitas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Cancelamento a qualquer momento</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleSubscribe('monthly')}
                          disabled={checkoutLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {checkoutLoading ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            'Escolher Plano Mensal'
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Plano Anual - Destaque */}
                    <Card className="relative border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white hover:border-blue-600 transition-all duration-300 transform hover:scale-105">
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-semibold">
                          <Star className="h-3 w-3 mr-1" />
                          MAIS POPULAR
                        </Badge>
                      </div>
                      <CardHeader className="text-center pb-4 pt-6">
                        <div className="flex items-center justify-center mb-2">
                          <Crown className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Plano Anual</CardTitle>
                        <CardDescription>Melhor custo-benefício</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900">R$ 979,00</div>
                          <div className="text-gray-600">por ano</div>
                          <div className="text-sm text-green-600 font-semibold mt-1">
                            Economia de R$ 195,80 (2 meses grátis!)
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Tudo do plano mensal</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">2 meses grátis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Suporte prioritário</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Acesso antecipado a novos recursos</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleSubscribe('annual')}
                          disabled={checkoutLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {checkoutLoading ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            'Escolher Plano Anual'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
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

              
            </div>
          </TrialWrapper>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
} 