'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface CadastroData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function CadastroPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [data, setData] = useState<CadastroData>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const router = useRouter();

  const handleInputChange = (field: keyof CadastroData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!data.email || !data.password || !data.confirmPassword) {
      toast.error('Preencha todos os campos');
      return false;
    }
    
    if (data.password !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return false;
    }
    
    if (data.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      console.log('🔍 Cadastro: Iniciando criação de conta...');
      console.log('🔍 Cadastro: Email:', data.email);

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      console.log('🔍 Cadastro: Resposta do Supabase:', { authData, authError });

      if (authError) {
        console.error('❌ Cadastro: Erro no cadastro:', authError);
        
        // Tratamento específico para diferentes tipos de erro
        if (authError.message.includes('confirmation email')) {
          toast.error('Erro ao enviar email de confirmação. Verifique se o email está correto.');
        } else if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error(`Erro no cadastro: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        console.error('❌ Cadastro: Usuário não foi criado');
        toast.error('Erro: Usuário não foi criado');
        return;
      }

      console.log('✅ Cadastro: Usuário criado com sucesso:', authData.user.id);

      // Salvar email no localStorage para reenvio
      localStorage.setItem(`pendingEmail_${authData.user.id}`, data.email);

      // Verificar se o email foi enviado
      if (authData.user.email_confirmed_at) {
        console.log('✅ Cadastro: Email já confirmado');
        toast.success('Conta criada com sucesso!');
        router.push('/create-profile');
      } else {
        console.log('📧 Cadastro: Email de confirmação enviado');
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
        router.push('/cadastro/confirmacao');
      }

    } catch (error) {
      console.error('❌ Cadastro: Erro inesperado:', error);
      toast.error('Erro ao realizar cadastro. Tente novamente.');
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

        {/* Card de Cadastro */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Comece seu teste gratuito</CardTitle>
            <CardDescription className="text-center">
              7 dias grátis • Sem cartão de crédito • Cancele quando quiser
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={data.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={data.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </a>
              </p>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Após criar sua conta, você será direcionado para configurar os dados da sua empresa.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 