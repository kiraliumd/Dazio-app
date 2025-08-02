'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SimpleTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTest = async (planType: 'monthly' | 'annual') => {
    console.log('🔄 Iniciando teste para:', planType);
    setLoading(true);
    setMessage(`Testando ${planType}...`);
    
    try {
      // Simular uma chamada de API
      console.log('📞 Fazendo chamada para createSubscription...');
      
      // Teste simples primeiro
      setMessage(`Teste ${planType} iniciado!`);
      
      // Aguardar um pouco para simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage(`Teste ${planType} concluído!`);
      console.log('✅ Teste concluído com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste Simples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={() => handleTest('monthly')}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Mensal'}
          </Button>
          
          <Button 
            onClick={() => handleTest('annual')}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Carregando...' : 'Testar Anual'}
          </Button>
        </div>
        
        {message && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <p className="text-sm text-gray-600 text-center">
          Abra o console do navegador (F12) para ver os logs
        </p>
      </CardContent>
    </Card>
  );
} 