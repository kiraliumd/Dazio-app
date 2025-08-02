'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestStripeNoAuth() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleTest = async (planType: 'monthly' | 'annual') => {
    console.log('🔄 TestStripeNoAuth: Iniciando teste para:', planType);
    setLoading(true);
    setDebugInfo(`Iniciando teste para ${planType}...`);
    
    try {
      // Testar diretamente a API do Stripe sem autenticação
      console.log('📞 TestStripeNoAuth: Testando Stripe diretamente...');
      setDebugInfo('Testando Stripe diretamente...');
      
      const response = await fetch('/api/stripe/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });
      
      console.log('📋 TestStripeNoAuth: Resposta do servidor:', response.status);
      setDebugInfo(`Resposta do servidor: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ TestStripeNoAuth: Dados recebidos:', data);
        setDebugInfo(`Dados recebidos: ${JSON.stringify(data, null, 2)}`);
        
        if (data.success && data.checkoutUrl) {
          setDebugInfo('Redirecionando para checkout do Stripe...');
          window.location.href = data.checkoutUrl;
        }
      } else {
        const errorData = await response.json();
        console.error('❌ TestStripeNoAuth: Erro na resposta:', errorData);
        setDebugInfo(`Erro na resposta: ${JSON.stringify(errorData, null, 2)}`);
      }
      
    } catch (error) {
      console.error('❌ TestStripeNoAuth: Erro na chamada:', error);
      setDebugInfo(`Erro na chamada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste Stripe (Sem Auth)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => handleTest('monthly')}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Stripe Mensal'}
          </Button>
          
          <Button 
            onClick={() => handleTest('annual')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Stripe Anual'}
          </Button>
        </div>
        
        {debugInfo && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-600 text-center">
          Teste direto do Stripe sem autenticação
        </p>
      </CardContent>
    </Card>
  );
} 