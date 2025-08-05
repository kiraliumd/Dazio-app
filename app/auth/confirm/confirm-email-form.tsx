'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function ConfirmEmailForm() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');

    console.log('🔍 Confirm Page: Parâmetros recebidos:', { token, type, error, errorCode });
    console.log('🔍 Confirm Page: URL completa:', window.location.href);

    // Se há erro na URL, verificar se o usuário já está autenticado
    if (error || errorCode) {
      console.log('⚠️ Confirm Page: Erro detectado na URL:', error, errorCode);
      handleErrorCase();
      return;
    }

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Link de confirmação inválido');
      setLoading(false);
      return;
    }

    handleConfirmation(token);
  }, [searchParams]);

  const handleErrorCase = async () => {
    try {
      console.log('🔍 Confirm Page: Verificando se usuário já está autenticado...');
      
      // Verificar se o usuário já está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email_confirmed_at) {
        console.log('✅ Confirm Page: Usuário já confirmado, redirecionando...');
        setStatus('success');
        setMessage('Email já foi confirmado anteriormente! Redirecionando...');
        toast.success('Email já confirmado!');
        
        // Criar perfil da empresa se necessário
        await createCompanyProfile();
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }
      
      // Se não está autenticado, mostrar erro
      console.log('❌ Confirm Page: Usuário não autenticado e link com erro');
      setStatus('error');
      setMessage('Link de confirmação expirado ou inválido. Por favor, faça login ou solicite um novo link.');
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Confirm Page: Erro ao verificar usuário:', error);
      setStatus('error');
      setMessage('Erro ao verificar status da conta. Tente fazer login.');
      setLoading(false);
    }
  };

  const handleConfirmation = async (token: string) => {
    try {
      console.log('🔍 Confirm Page: Processando confirmação...');
      console.log('🔍 Confirm Page: Token recebido:', token);
      
      // Primeiro, verificar se o usuário já está autenticado e confirmado
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔍 Confirm Page: Usuário atual:', currentUser);
      
      // Se o usuário já está autenticado e confirmado
      if (currentUser && currentUser.email_confirmed_at) {
        console.log('✅ Confirm Page: Usuário já confirmado anteriormente');
        setStatus('success');
        setMessage('Email já foi confirmado anteriormente! Redirecionando...');
        toast.success('Email já confirmado!');
        
        // Criar perfil da empresa se necessário
        await createCompanyProfile();
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
        return;
      }
      
      // Se o usuário está autenticado mas não confirmado, tentar verificar o token
      if (currentUser && !currentUser.email_confirmed_at) {
        console.log('🔍 Confirm Page: Usuário autenticado mas não confirmado, verificando token...');
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('❌ Confirm Page: Erro na confirmação:', error);
          
          // Verificar novamente se o usuário foi confirmado apesar do erro
          const { data: { user: userAfterError } } = await supabase.auth.getUser();
          if (userAfterError && userAfterError.email_confirmed_at) {
            console.log('✅ Confirm Page: Usuário confirmado apesar do erro de token');
            setStatus('success');
            setMessage('Email confirmado com sucesso! Redirecionando...');
            toast.success('Email confirmado com sucesso!');
            
            await createCompanyProfile();
            
            setTimeout(() => {
              router.push('/');
            }, 3000);
            return;
          }
          
          // Se realmente houve erro e o usuário não foi confirmado
          setStatus('error');
          setMessage(`Erro na confirmação: ${error.message}. Tente fazer login ou solicite um novo link.`);
          toast.error('Erro na confirmação do email');
        } else {
          console.log('✅ Confirm Page: Email confirmado com sucesso');
          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando...');
          toast.success('Email confirmado com sucesso!');
          
          // Criar perfil da empresa após confirmação
          await createCompanyProfile();
          
          // Redirecionar após 3 segundos
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } else {
        // Se o usuário não está autenticado, tentar verificar o token
        console.log('🔍 Confirm Page: Usuário não autenticado, verificando token...');
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('❌ Confirm Page: Erro na confirmação:', error);
          setStatus('error');
          setMessage(`Erro na confirmação: ${error.message}. Tente fazer login ou solicite um novo link.`);
          toast.error('Erro na confirmação do email');
        } else {
          console.log('✅ Confirm Page: Email confirmado com sucesso');
          setStatus('success');
          setMessage('Email confirmado com sucesso! Redirecionando...');
          toast.success('Email confirmado com sucesso!');
          
          // Criar perfil da empresa após confirmação
          await createCompanyProfile();
          
          // Redirecionar após 3 segundos
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('❌ Confirm Page: Erro inesperado:', error);
      setStatus('error');
      setMessage('Erro inesperado. Tente novamente.');
      toast.error('Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const createCompanyProfile = async () => {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Confirm Page: Usuário não autenticado');
        return;
      }

      // Verificar se o perfil já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Confirm Page: Erro ao verificar perfil existente:', checkError);
        return;
      }

      if (existingProfile) {
        console.log('✅ Confirm Page: Perfil da empresa já existe:', existingProfile.id);
        return;
      }

      // Obter dados temporários do localStorage com chave única
      const pendingProfileData = localStorage.getItem(`pendingProfileData_${user.id}`);
      if (!pendingProfileData) {
        console.log('⚠️ Confirm Page: Dados do perfil não encontrados (pode ser um usuário existente)');
        return;
      }

      const profileData = JSON.parse(pendingProfileData);

      // 1. Criar perfil da empresa
      const { data: profileResult, error: profileError } = await supabase
        .from('company_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Confirm Page: Erro ao criar perfil:', profileError);
        return;
      }

      // 2. Verificar se as configurações já existem
      const { data: existingSettings, error: settingsCheckError } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', profileResult.id)
        .single();

      if (settingsCheckError && settingsCheckError.code !== 'PGRST116') {
        console.error('❌ Confirm Page: Erro ao verificar configurações existentes:', settingsCheckError);
        return;
      }

      if (!existingSettings) {
        // Criar configurações da empresa apenas se não existirem
        const { error: settingsError } = await supabase
          .from('company_settings')
          .insert({
            company_id: profileResult.id,
            company_name: profileData.company_name,
            cnpj: profileData.cnpj,
            address: profileData.address,
            phone: profileData.phone,
            website: profileData.website,
            contract_template: `CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

CONTRATANTE: {company_name}
CNPJ: {cnpj}
Endereço: {address}
Telefone: {phone}

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

Data: {contract_date}`
          });

        if (settingsError) {
          console.error('❌ Confirm Page: Erro ao criar configurações:', settingsError);
          return;
        }

        console.log('✅ Confirm Page: Configurações criadas com sucesso');
      } else {
        console.log('✅ Confirm Page: Configurações já existem');
      }

      // Limpar dados temporários
      localStorage.removeItem(`pendingProfileData_${user.id}`);
      localStorage.removeItem(`pendingEmail_${user.id}`);

      console.log('✅ Confirm Page: Perfil e configurações criados com sucesso');
    } catch (error) {
      console.error('❌ Confirm Page: Erro ao criar perfil da empresa:', error);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToCadastro = () => {
    router.push('/cadastro');
  };

  if (loading) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Processando confirmação...</h2>
          <p className="text-gray-600">Aguarde enquanto verificamos seu email.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email confirmado!</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Erro na confirmação</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="space-y-2">
          <Button onClick={handleGoToLogin} className="w-full">
            Ir para Login
          </Button>
          <Button onClick={handleGoToCadastro} variant="outline" className="w-full">
            Criar Nova Conta
          </Button>
        </div>
      </div>
    </div>
  );
} 