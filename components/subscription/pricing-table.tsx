'use client';

import { useState } from 'react';
import { createSubscription } from '@/lib/subscription/actions';
import { loadStripe } from '@stripe/stripe-js';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

const plans = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 97.9,
    period: 'mês',
    description: 'Ideal para empresas que estão começando',
    features: [
      'Acesso completo ao sistema',
      'Gestão de orçamentos e locações',
      'Controle de equipamentos',
      'Relatórios financeiros',
      'Geração de contratos em PDF',
      'Sistema de recorrência',
      'Agenda de eventos',
      'Suporte por email',
      'Atualizações incluídas',
    ],
    popular: false,
    trialDays: 7,
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    price: 979.0,
    period: 'ano',
    description: 'Melhor custo-benefício com 2 meses grátis',
    features: [
      'Todas as funcionalidades do plano mensal',
      '2 meses grátis',
      'Suporte prioritário',
      'Backup automático',
      'Logs de auditoria',
      'Integração com APIs',
      'Relatórios avançados',
      'Treinamento incluído',
    ],
    popular: true,
    trialDays: 7,
    savings: 'Economia de R$ 195,80',
  },
];

export function PricingTable() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(planId);

      const { sessionId } = await createSubscription(
        planId as 'monthly' | 'annual'
      );

      const stripe = await loadStripe(stripePublicKey);
      if (!stripe) {
        throw new Error('Erro ao carregar Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {plans.map(plan => (
        <Card
          key={plan.id}
          className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
        >
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
              Mais Popular
            </Badge>
          )}

          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">R$ {plan.price}</span>
              <span className="text-gray-600 ml-2">/{plan.period}</span>
            </div>
            {plan.savings && (
              <p className="text-green-600 font-medium text-sm">
                {plan.savings}
              </p>
            )}
            <p className="text-gray-600 text-sm">{plan.description}</p>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className={`w-full ${
                plan.popular
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {loading === plan.id
                ? 'Processando...'
                : `Começar Teste Grátis (${plan.trialDays} dias)`}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Cancele a qualquer momento durante o período de teste
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
