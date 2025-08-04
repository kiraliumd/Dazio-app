'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ConfirmEmailForm } from './confirm-email-form';

export default function ConfirmPage() {
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
            <Suspense fallback={
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Carregando...</h3>
                  <p className="text-gray-600 text-sm">
                    Aguarde enquanto carregamos a página.
                  </p>
                </div>
              </div>
            }>
              <ConfirmEmailForm />
            </Suspense>
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