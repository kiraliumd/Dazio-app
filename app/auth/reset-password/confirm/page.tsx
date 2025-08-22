'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

function ResetPasswordConfirmContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Verificar se há parâmetros de erro na URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const messageParam = urlParams.get('message');

        // Verificar se há erros no hash da URL (erros do Supabase)
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const hashError = hashParams.get('error');
          const errorCode = hashParams.get('error_code');
          const errorDescription = hashParams.get('error_description');

          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Reset Password: Hash params:', {
              hashError,
              errorCode,
              errorDescription,
            });
          }

          if (hashError === 'access_denied') {
            if (errorCode === 'otp_expired') {
              setError('Link de redefinição expirado. Solicite um novo link.');
            } else {
              setError(
                errorDescription ||
                  'Link de redefinição inválido. Solicite um novo link.'
              );
            }
            setIsValidToken(false);
            setIsCheckingToken(false);
            return;
          }
        }

        if (errorParam === 'auth_failed') {
          setError(
            messageParam ||
              'Link inválido ou expirado. Solicite um novo link de redefinição.'
          );
          setIsValidToken(false);
          setIsCheckingToken(false);
          return;
        }

        // Verificar se há uma sessão válida (token de reset)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setError(
            'Link inválido ou expirado. Solicite um novo link de redefinição.'
          );
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
        }
      } catch (err) {
        setError('Erro ao verificar link. Tente novamente.');
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, []); // Array vazio para executar apenas uma vez

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Senha é obrigatória');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Confirmação de senha é obrigatória');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('As senhas não coincidem');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      validatePassword(value);
    }
    if (confirmPassword && confirmPasswordError) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (confirmPasswordError) {
      validateConfirmPassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError('Erro ao atualizar senha. Tente novamente.');
      } else {
        setSuccess(true);
        // Fazer logout para garantir que o usuário faça login com a nova senha
        await supabase.auth.signOut();
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingToken) {
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
            <CardContent className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-10 w-1/2 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
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
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                Link Inválido
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                O link de redefinição é inválido ou expirou
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/reset-password')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Solicitar Novo Link
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
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
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Senha Alterada!
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sua senha foi atualizada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Agora você pode fazer login com sua nova senha.
                </p>
              </div>

              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Ir para o Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Nova Senha
            </CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => validatePassword(password)}
                    className={`pl-10 pr-10 ${passwordError ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    className={`pl-10 pr-10 ${confirmPasswordError ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Erro */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botão de Atualizar */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </form>

            {/* Links de ajuda */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors p-0 h-auto font-normal"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </div>
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

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
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
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
                <p className="text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
