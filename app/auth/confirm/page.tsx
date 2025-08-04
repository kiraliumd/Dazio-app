'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    console.log('🔍 Confirm Page: Parâmetros recebidos:', { token, type });

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Link de confirmação inválido');
      setLoading(false);
      return;
    }

    handleConfirmation(token);
  }, [searchParams]);

  const handleConfirmation = async (token: string) => {
    try {
      console.log('🔍 Confirm Page: Processando confirmação...');
      
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        console.error('❌ Confirm Page: Erro na confirmação:', error);
        setStatus('error');
        setMessage(`Erro na confirmação: ${error.message}`);
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
          router.push('/dashboard');
        }, 3000);
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
      // Obter dados temporários do localStorage
      const pendingProfileData = localStorage.getItem('pendingProfileData');
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

      // 2. Criar configurações da empresa
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

      // Limpar dados temporários
      localStorage.removeItem('pendingProfileData');
      localStorage.removeItem('pendingEmail');

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
              Processando sua confirmação...
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Processando...</h3>
                  <p className="text-gray-600 text-sm">
                    Aguarde enquanto confirmamos seu email.
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
                    {message}
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
                    Se o problema persistir, tente fazer login ou criar uma nova conta.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleGoToLogin}
                    className="w-full"
                  >
                    Ir para login
                  </Button>
                  
                  <Button
                    onClick={handleGoToCadastro}
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