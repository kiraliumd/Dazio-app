'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export function TestSupabase() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testSupabase = async () => {
    setLoading(true);
    setStatus('Testando conexão...');
    
    try {
      const supabase = createClient();
      
      // Testar se conseguimos acessar o Supabase
      const { data, error } = await supabase
        .from('company_profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        setStatus(`Erro: ${error.message}`);
      } else {
        setStatus('✅ Supabase conectado com sucesso!');
      }
    } catch (error) {
      setStatus(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testSupabase}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </Button>
        
        {status && (
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm">{status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 