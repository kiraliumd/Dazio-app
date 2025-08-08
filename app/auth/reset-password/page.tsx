"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Email é obrigatório')
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError('Digite um email válido')
      return false
    }
    setEmailError('')
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      validateEmail(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const isEmailValid = validateEmail(email)
    if (!isEmailValid) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Erro ao processar solicitação')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              style={{ height: 'auto', width: '120px' }}
              priority
            />
          </div>

          {/* Card de Sucesso */}
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Email Enviado!</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Verifique sua caixa de entrada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enviamos um link para redefinir sua senha para:
                </p>
                <p className="font-medium text-foreground">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Clique no link no email para criar uma nova senha.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full"
                >
                  Enviar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>&copy; 2025 Dazio. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    )
  }

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
            style={{ height: 'auto', width: '120px' }}
            priority
          />
        </div>

        {/* Card de Reset de Senha */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              Digite seu email para receber um link de redefinição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => validateEmail(email)}
                    className={`pl-10 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                    disabled={loading}
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Erro */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botão de Enviar */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Redefinição'
                )}
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
  )
}
