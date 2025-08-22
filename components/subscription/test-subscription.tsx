'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function TestSubscription() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleCreateSubscription = async (planType: 'monthly' | 'annual') => {
    console.log(
      '🔄 TestSubscription: Iniciando criação de assinatura para:',
      planType
    );
    setLoading(true);
    setDebugInfo(`Iniciando teste para ${planType}...`);

    try {
      console.log('📞 TestSubscription: Chamando API...');
      setDebugInfo('Chamando API...');

      const response = await fetch('/api/test-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });

      const result = await response.json();

      console.log('📋 TestSubscription: Resultado recebido:', result);
      setDebugInfo(`Resultado: ${JSON.stringify(result, null, 2)}`);

      if (result.success && result.checkoutUrl) {
        console.log('✅ TestSubscription: Redirecionando para checkout...');
        setDebugInfo('Redirecionando para checkout do Stripe...');

        // Redirecionar para o checkout do Stripe
        window.location.href = result.checkoutUrl;
      } else {
        console.error(
          '❌ TestSubscription: Erro na criação da assinatura:',
          result.error
        );
        setDebugInfo(`Erro: ${result.error || 'Erro desconhecido'}`);
        toast.error(result.error || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('❌ TestSubscription: Erro inesperado:', error);
      setDebugInfo(
        `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste de Assinatura (Stripe)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={() => handleCreateSubscription('monthly')}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Plano Mensal'}
          </Button>

          <Button
            onClick={() => handleCreateSubscription('annual')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Plano Anual'}
          </Button>
        </div>

        {debugInfo && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 text-center">
          Abra o console do navegador (F12) para ver os logs detalhados
        </p>
      </CardContent>
    </Card>
  );
}
