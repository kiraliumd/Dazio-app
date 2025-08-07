'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setStatus('not-found');
      setMessage('Email não fornecido na URL.');
      return;
    }

    handleUnsubscribe();
  }, [email]);

  const handleUnsubscribe = async () => {
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.error || 'Erro ao processar desinscrição');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro interno do servidor');
    }
  };

  const handleResubscribe = async () => {
    try {
      const response = await fetch('/api/check-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success && !result.exists) {
        // Re-adicionar à audiência
        const resubscribeResponse = await fetch('/api/resubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const resubscribeResult = await resubscribeResponse.json();

        if (resubscribeResult.success) {
          setStatus('success');
          setMessage('Email re-inscrito com sucesso!');
        } else {
          setStatus('error');
          setMessage('Erro ao re-inscrever email');
        }
      } else {
        setStatus('success');
        setMessage('Email já está inscrito!');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro ao processar re-inscrição');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Gerenciar Inscrição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Email: <span className="font-medium">{email}</span>
              </p>
            </div>
          )}

          {status === 'loading' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processando sua solicitação...
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'not-found' && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="text-center space-y-2">
              <Button 
                onClick={handleResubscribe}
                variant="outline"
                className="w-full"
              >
                Re-inscrever Email
              </Button>
              <p className="text-xs text-muted-foreground">
                Você pode re-inscrever seu email a qualquer momento
              </p>
            </div>
          )}

          <div className="text-center pt-4">
            <a 
              href="/"
              className="text-sm text-primary hover:underline"
            >
              Voltar ao Dazio
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 