'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createSubscription } from '@/lib/subscription/actions';
import { toast } from 'sonner';

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
}

export default function AssinaturaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Carregar perfil da empresa
      const { data: profileData } = await fetch('/api/company/profile').then(res => res.json());
      setCompanyProfile(profileData);

      // Carregar dados da assinatura
      const { data: subscriptionData } = await fetch('/api/subscription').then(res => res.json());
      setSubscription(subscriptionData);

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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da assinatura...</p>
        </div>
      </div>
    );
  }

  // Se tem assinatura ativa, redirecionar para dashboard
  if (subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due') {
    router.push('/dashboard');
    return null;
  }

  const trialEndDate = companyProfile?.trial_end ? new Date(companyProfile.trial_end) : null;
  const isTrialExpired = trialEndDate ? isAfter(new Date(), trialEndDate) : false;
  const trialDaysLeft = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;
  const trialProgress = companyProfile?.trial_start && trialEndDate 
    ? Math.max(0, Math.min(100, ((7 - trialDaysLeft) / 7) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestão da Assinatura
            </h1>
            <p className="text-gray-600">
              Gerencie sua assinatura e continue aproveitando todos os recursos
            </p>
          </div>

          {/* Status da Assinatura */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Badge 
                    variant={subscription?.status === 'active' ? 'default' : 'secondary'}
                    className="mb-2"
                  >
                    {subscription?.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {subscription?.plan_type === 'annual' ? 'Anual' : 'Mensal'}
                  </p>
                  <p className="text-sm text-gray-600">Plano</p>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    R$ {subscription?.plan_type === 'annual' ? '1.174,80' : '97,90'}
                  </p>
                  <p className="text-sm text-gray-600">Valor</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Status */}
          {companyProfile?.status === 'trial' && (
            <Card className="mb-6">
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

          {/* Planos de Assinatura */}
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
                  onClick={() => handleSubscribe('monthly')}
                  disabled={checkoutLoading}
                  className="w-full"
                >
                  {checkoutLoading ? 'Carregando...' : 'Assinar Mensal'}
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
                  onClick={() => handleSubscribe('annual')}
                  disabled={checkoutLoading}
                  className="w-full"
                  variant="default"
                >
                  {checkoutLoading ? 'Carregando...' : 'Assinar Anual'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Gerenciar Assinatura */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Assinatura</CardTitle>
                <CardDescription>
                  Acesse o portal do Stripe para gerenciar pagamentos e cancelamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="w-full"
                >
                  Acessar Portal do Cliente
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 