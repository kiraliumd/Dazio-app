'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { AlertTriangleIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';

export function TrialBanner() {
  const { trialStatus, loading } = useTrialStatus();

  if (loading || !trialStatus) {
    return null;
  }

  // Se não está em trial, não mostra o banner
  if (trialStatus.status !== 'trial') {
    return null;
  }

  // Se o trial expirou
  if (trialStatus.isExpired) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangleIcon className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>
              Seu período de teste gratuito expirou. Para continuar usando o
              sistema, assine um plano.
            </span>
            <Link href="/assinatura-gestao">
              <Button size="sm" className="ml-4">
                Assinar agora
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Se está em trial ativo
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <ClockIcon className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <span>
            <strong>Teste gratuito ativo:</strong>{' '}
            {trialStatus.daysLeft === 1
              ? '1 dia restante'
              : `${trialStatus.daysLeft} dias restantes`}
          </span>
          <div className="flex space-x-2">
            <Link href="/assinatura-gestao">
              <Button size="sm" variant="outline">
                Assinar agora
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {}}
            >
              Fechar
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
