'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestWithoutAuth() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleTest = async (planType: 'monthly' | 'annual') => {
    if (process.env.NODE_ENV === "development") { console.log('🔄 TestWithoutAuth: Iniciando teste para:', planType); }
    setLoading(true);
    setDebugInfo(`Iniciando teste para ${planType}...`);
    
    try {
      // Testar se conseguimos fazer uma chamada para o servidor
      if (process.env.NODE_ENV === "development") { console.log('📞 TestWithoutAuth: Fazendo chamada para API...'); }
      setDebugInfo('Fazendo chamada para API...');
      
      // Fazer uma chamada simples para testar se o servidor responde
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
      });
      
      if (process.env.NODE_ENV === "development") { console.log('📋 TestWithoutAuth: Resposta do servidor:', response.status); }
      setDebugInfo(`Resposta do servidor: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === "development") { console.log('✅ TestWithoutAuth: Dados recebidos:', data); }
        setDebugInfo(`Dados recebidos: ${JSON.stringify(data, null, 2)}`);
      } else {
        if (process.env.NODE_ENV === "development") { console.error('❌ TestWithoutAuth: Erro na resposta:', response.status); }
        setDebugInfo(`Erro na resposta: ${response.status}`);
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === "development") { console.error('❌ TestWithoutAuth: Erro na chamada:', error); }
      setDebugInfo(`Erro na chamada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste Sem Autenticação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => handleTest('monthly')}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar API Mensal'}
          </Button>
          
          <Button 
            onClick={() => handleTest('annual')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar API Anual'}
          </Button>
        </div>
        
        {debugInfo && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-xs font-mono whitespace-pre-wrap">{debugInfo}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-600 text-center">
          Teste de conectividade com o servidor
        </p>
      </CardContent>
    </Card>
  );
} 