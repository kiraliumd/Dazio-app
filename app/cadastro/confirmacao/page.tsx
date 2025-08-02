'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@supabase/supabase-js';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'dazio-auth'
    }
  }
);

function ConfirmacaoContent() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Pegar email do localStorage
    const pendingEmail = localStorage.getItem('pendingEmail');
    if (pendingEmail) {
      setEmail(pendingEmail);
    }

    // Verificar se há parâmetros de confirmação na URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');

    if (error === 'auth_failed') {
      setStatus('error');
      setMessage('Erro na confirmação do email. Tente novamente.');
      return;
    }

    if (token && type === 'signup') {
      handleEmailConfirmation(token);
    }
  }, [searchParams]);

  const handleEmailConfirmation = async (token: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        setStatus('error');
        setMessage('Erro ao confirmar email. Tente novamente.');
        toast.error('Erro ao confirmar email');
      } else {
        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando para o dashboard...');
        toast.success('Email confirmado com sucesso!');
        
        // Limpar email do localStorage
        localStorage.removeItem('pendingEmail');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro inesperado. Tente novamente.');
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não encontrado. Faça o cadastro novamente.');
      router.push('/cadastro');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        toast.error('Erro ao reenviar email');
      } else {
        toast.success('Email reenviado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao reenviar email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('pendingEmail');
    router.push('/login');
  };

  const handleGoToCadastro = () => {
    localStorage.removeItem('pendingEmail');
    router.push('/cadastro');
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
            <CardTitle className="text-2xl font-bold text-center">Confirme seu email</CardTitle>
            <CardDescription className="text-center">
              Verifique sua caixa de entrada para ativar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === 'pending' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Email enviado!</h3>
                  <p className="text-gray-600 text-sm">
                    Enviamos um link de confirmação para <strong>{email}</strong>. 
                    Clique no link para ativar sua conta e começar a usar o Dazio.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não recebeu o email? Verifique sua pasta de spam ou solicite um novo link.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      'Reenviar email'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleGoToLogin}
                    variant="ghost"
                    className="w-full"
                  >
                    Já confirmei, ir para login
                  </Button>
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
                    Sua conta foi ativada com sucesso. Você será redirecionado para o dashboard.
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

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      'Reenviar email de confirmação'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleGoToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Ir para login
                  </Button>

                  <Button
                    onClick={handleGoToCadastro}
                    variant="ghost"
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
function ConfirmacaoLoading() {
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

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={<ConfirmacaoLoading />}>
      <ConfirmacaoContent />
    </Suspense>
  );
} 