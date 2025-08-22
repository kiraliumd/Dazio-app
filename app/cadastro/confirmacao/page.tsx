'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

function ConfirmacaoContent() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(
    'pending'
  );
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeEmail = async () => {
      // Pegar email do localStorage (tentativa de compatibilidade)
      const pendingEmail = localStorage.getItem('pendingEmail');
      if (pendingEmail) {
        setEmail(pendingEmail);
      } else {
        // Tentar obter email do usuário autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
        }
      }
    };

    initializeEmail();

    // Verificar se há parâmetros de confirmação na URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const message = searchParams.get('message');

    console.log('🔍 Confirmacao: Parâmetros da URL:', {
      token,
      type,
      error,
      success,
      message,
    });

    if (success === 'true' && token && type === 'signup') {
      console.log('✅ Confirmacao: Sucesso detectado, processando confirmação');
      handleEmailConfirmation(token);
      return;
    }

    if (error === 'auth_failed') {
      setStatus('error');
      setMessage(
        message
          ? decodeURIComponent(message)
          : 'Erro na confirmação do email. Tente novamente.'
      );
      return;
    }

    // Se há token mas não foi processado ainda (caso de callback direto)
    if (token && type === 'signup' && !success) {
      console.log('🔍 Confirmacao: Token detectado, processando confirmação');
      handleEmailConfirmation(token);
    }
  }, []); // Array vazio para executar apenas uma vez

  const handleEmailConfirmation = async (token: string) => {
    setLoading(true);
    try {
      // Usar a nova API com Resend
      const response = await fetch('/api/auth/confirm-email-resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!result.success) {
        setStatus('error');
        setMessage(result.error || 'Erro ao confirmar email. Tente novamente.');
        toast.error(result.error || 'Erro ao confirmar email');
      } else {
        // Criar perfil da empresa após confirmação
        await createCompanyProfile();

        setStatus('success');
        setMessage(
          'Email confirmado com sucesso! Redirecionando para o dashboard...'
        );
        toast.success('Email confirmado com sucesso!');

        // Limpar dados do localStorage
        localStorage.removeItem('pendingEmail');
        localStorage.removeItem('pendingProfileData');

        // Limpar dados com chaves únicas também
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          localStorage.removeItem(`pendingEmail_${user.id}`);
          localStorage.removeItem(`pendingProfileData_${user.id}`);
        }

        // Redirecionar após 1s para criar perfil
        setTimeout(() => {
          router.push('/create-profile');
        }, 1000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro inesperado. Tente novamente.');
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const createCompanyProfile = async () => {
    try {
      // Obter email do localStorage
      const pendingEmail = localStorage.getItem('pendingEmail');
      if (!pendingEmail) {
        console.error('Email não encontrado no localStorage');
        return;
      }

      // Obter dados temporários do localStorage (se existirem)
      const pendingProfileData = localStorage.getItem('pendingProfileData');
      let profileData = {};

      if (pendingProfileData) {
        profileData = JSON.parse(pendingProfileData);
      }

      // Criar perfil básico da empresa com email
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        return;
      }

      const basicProfileData = {
        user_id: user.id,
        email: pendingEmail, // Email da primeira etapa do cadastro
        company_name: 'Empresa', // Nome temporário
        cnpj: '00.000.000/0000-00', // CNPJ temporário
        address: 'Endereço temporário',
        city: 'Cidade temporária',
        state: 'SP',
        zip_code: '00000-000',
        phone: '(00) 00000-0000',
        website: null,
        industry: null,
        employee_count: null,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        status: 'trial',
      };

      console.log(
        '🔍 Confirmacao: Criando perfil básico com email:',
        pendingEmail
      );

      // 1. Criar perfil básico da empresa
      const { data: profileResult, error: profileError } = await supabase
        .from('company_profiles')
        .insert(basicProfileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Confirmacao: Erro ao criar perfil:', profileError);
        toast.error(`Erro ao criar perfil: ${profileError.message}`);
        return;
      }

      console.log(
        '✅ Confirmacao: Perfil básico criado com sucesso:',
        profileResult
      );

      // 2. Atualizar template no profile
      const { error: settingsError } = await supabase
        .from('company_profiles')
        .update({
          contract_template: `CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

CONTRATANTE: {company_name}
CNPJ: {cnpj}
Endereço: {address}
Telefone: {phone}
Email: {email}

CONTRATADO: {client_name}
Documento: {client_document}
Endereço: {client_address}
Telefone: {client_phone}
Email: {client_email}

OBJETO DO CONTRATO:
A locação dos seguintes equipamentos:

{equipment_list}

PERÍODO DE LOCAÇÃO:
Data de início: {start_date}
Data de término: {end_date}
Horário de instalação: {installation_time}
Horário de retirada: {removal_time}

LOCAL DE INSTALAÇÃO:
{installation_location}

VALORES:
Valor total: R$ {total_value}
Desconto: R$ {discount}
Valor final: R$ {final_value}

CONDIÇÕES GERAIS:
1. O contratado se compromete a devolver os equipamentos no estado em que foram recebidos.
2. Qualquer dano ou perda será de responsabilidade do contratado.
3. O pagamento deve ser realizado conforme acordado entre as partes.
4. Este contrato está sujeito às leis brasileiras.

Assinaturas:

_____________________
{company_name}
Contratante

_____________________
{client_name}
Contratado

Data: {contract_date}`,
        })
        .eq('id', profileResult.id)
        .select('id')
        .single();

      if (settingsError) {
        console.error(
          '❌ Confirmacao: Erro ao criar configurações:',
          settingsError
        );
        toast.error(`Erro ao criar configurações: ${settingsError.message}`);
        return;
      }

      console.log('✅ Confirmacao: Template atualizado no profile');
    } catch (error) {
      console.error('❌ Confirmacao: Erro ao criar perfil da empresa:', error);
      toast.error('Erro ao criar perfil da empresa');
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
      // Usar a nova API com Resend
      const response = await fetch('/api/auth/confirm-email-resend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Erro ao reenviar email');
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
          <BrandLogo width={120} height={48} className="mx-auto" priority />
        </div>

        {/* Card de Confirmação */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Confirme seu email
            </CardTitle>
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
                    Enviamos um link de confirmação para{' '}
                    <strong>{email}</strong>. Clique no link para ativar sua
                    conta e começar a usar o Dazio.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Não recebeu o email? Verifique sua pasta de spam ou solicite
                    um novo link.
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
                  <h3 className="text-lg font-semibold text-green-600">
                    Email confirmado!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sua conta foi ativada com sucesso. Você será redirecionado
                    para o dashboard.
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
                  <h3 className="text-lg font-semibold text-red-600">
                    Erro na confirmação
                  </h3>
                  <p className="text-gray-600 text-sm">{message}</p>
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
          <BrandLogo width={120} height={48} className="mx-auto" priority />
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
