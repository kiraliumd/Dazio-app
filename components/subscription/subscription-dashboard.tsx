'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    cancelSubscription,
    getCustomerPortalUrl,
} from '@/lib/subscription/actions';
import { Subscription } from '@/lib/subscription/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangleIcon, CalendarIcon, CreditCardIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionDashboardProps {
  subscription: Subscription;
}

export function SubscriptionDashboard({
  subscription,
}: SubscriptionDashboardProps) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }

    try {
      setLoading(true);
      await cancelSubscription();
      toast.success(
        'Assinatura cancelada com sucesso. Você terá acesso até o final do período atual.'
      );
      window.location.reload();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayments = async () => {
    try {
      setLoading(true);
      const { url } = await getCustomerPortalUrl();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      toast.error('Erro ao abrir portal de pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'trialing':
        return 'Período de Teste';
      case 'past_due':
        return 'Pagamento Pendente';
      case 'canceled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha Assinatura</h1>
          <p className="text-gray-600">
            Gerencie sua assinatura e informações de pagamento
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(subscription.status)}>
                    {getStatusText(subscription.status)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-medium">
                    {subscription.plan_type === 'monthly' ? 'Mensal' : 'Anual'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-medium">
                    {subscription.plan_type === 'monthly'
                      ? 'R$ 97,90'
                      : 'R$ 979,00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximo Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Próximo Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscription.trial_end &&
                new Date(subscription.trial_end) > new Date() ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Período de teste termina em:
                    </p>
                    <p className="font-medium text-lg">
                      {format(new Date(subscription.trial_end), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Próxima cobrança:
                    </p>
                    <p className="font-medium text-lg">
                      {subscription.current_period_end
                        ? format(
                            new Date(subscription.current_period_end),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )
                        : 'N/A'}
                    </p>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertTriangleIcon className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Sua assinatura será cancelada no final do período atual
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={handleManagePayments}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Gerenciar Pagamentos
          </Button>

          {!subscription.cancel_at_period_end && (
            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {loading ? 'Cancelando...' : 'Cancelar Assinatura'}
            </Button>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Informações Importantes</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Você pode cancelar sua assinatura a qualquer momento</li>
            <li>
              • O acesso ao sistema será mantido até o final do período atual
            </li>
            <li>• Para dúvidas sobre pagamentos, entre em contato conosco</li>
            <li>
              • Todas as atualizações do sistema estão incluídas no seu plano
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
