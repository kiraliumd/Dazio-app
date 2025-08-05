'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

function ConfirmContent() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      handleEmailConfirmation(token);
    } else {
      setStatus('error');
      setMessage('Token de confirmação não encontrado');
    }
  }, [searchParams]);

  const handleEmailConfirmation = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/confirm-email-resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const result = await response.json();

      if (!result.success) {
        setStatus('error');
        setMessage(result.error || 'Erro ao confirmar email');
        toast.error(result.error || 'Erro ao confirmar email');
      } else {
        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando...');
        toast.success('Email confirmado com sucesso!');
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/create-profile');
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro inesperado. Tente novamente.');
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-dazio.svg"
            alt="Dazio Logo"
            width={120}
            height={48}
            className="mx-auto"
            priority
          />
        </div>

        {/* Card de Confirmação */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Confirmação de Email</CardTitle>
            <CardDescription className="text-center">
              Processando sua confirmação
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Confirmando email...</h3>
                  <p className="text-gray-600 text-sm">
                    Aguarde enquanto processamos sua confirmação.
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600">Email confirmado!</h3>
                  <p className="text-gray-600 text-sm">
                    Sua conta foi ativada com sucesso. Você será redirecionado para configurar seu perfil.
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecionando...</span>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-600">Erro na confirmação</h3>
                  <p className="text-gray-600 text-sm">
                    {message}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Se você acredita que isso é um erro, entre em contato com nosso suporte.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Ir para login
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/cadastro')}
                    variant="outline"
                    className="w-full"
                  >
                    Fazer novo cadastro
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2025 Dazio. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

// Componente de loading para Suspense
function ConfirmLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo-dazio.svg"
            alt="Dazio Logo"
            width={120}
            height={48}
            className="mx-auto"
            priority
          />
        </div>
        <Card className="shadow-xl border-0">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmLoading />}>
      <ConfirmContent />
    </Suspense>
  );
} 