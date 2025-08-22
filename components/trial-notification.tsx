'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { differenceInDays, isAfter } from 'date-fns';

interface TrialNotificationProps {
  trialEnd: string;
  companyName: string;
}

export function TrialNotification({
  trialEnd,
  companyName,
}: TrialNotificationProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const trialEndDate = new Date(trialEnd);
    const now = new Date();
    const days = differenceInDays(trialEndDate, now);

    // Mostrar notificação se faltam 3 dias ou menos, ou se já expirou
    if (days <= 3 || isAfter(now, trialEndDate)) {
      setDaysLeft(days);
      setIsVisible(true);
    }
  }, [trialEnd]);

  const handleUpgrade = () => {
    router.push('/assinatura-gestao');
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isExpired = daysLeft < 0;

  return (
    <Alert
      className={`mb-4 ${isExpired ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
        </div>

        <div className="flex-1">
          <AlertDescription className="text-sm">
            {isExpired ? (
              <>
                <strong>Seu período de teste expirou!</strong> Para continuar
                usando o {companyName}, faça upgrade para um plano pago.
              </>
            ) : (
              <>
                <strong>
                  Seu período de teste termina em {daysLeft} dias.
                </strong>
                Faça upgrade para continuar aproveitando todos os recursos.
              </>
            )}
          </AlertDescription>

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleUpgrade}
              className={isExpired ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isExpired ? 'Fazer Upgrade Agora' : 'Fazer Upgrade'}
            </Button>

            {!isExpired && (
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Lembrar depois
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}
