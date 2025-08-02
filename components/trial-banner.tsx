'use client';

import { useState, useEffect } from 'react';
import { AlertTriangleIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { TrialStatus, formatDaysLeft } from '@/lib/trial-check';
import Link from 'next/link';

export function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('company_profiles')
        .select('trial_end, status')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        setTrialStatus({
          isActive: false,
          isExpired: true,
          daysLeft: 0,
          trialEnd: null,
          status: 'expired'
        });
        setLoading(false);
        return;
      }

      const now = new Date();
      const trialEnd = new Date(profile.trial_end);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = now > trialEnd;

      setTrialStatus({
        isActive: !isExpired && profile.status === 'trial',
        isExpired,
        daysLeft: Math.max(0, daysLeft),
        trialEnd: profile.trial_end,
        status: profile.status as 'trial' | 'active' | 'expired' | 'cancelled'
      });
    } catch (error) {
      console.error('Erro ao verificar trial:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <span>Seu período de teste gratuito expirou. Para continuar usando o sistema, assine um plano.</span>
            <Link href="/assinatura">
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
            <strong>Teste gratuito ativo:</strong> {formatDaysLeft(trialStatus.daysLeft)}
          </span>
          <div className="flex space-x-2">
            <Link href="/assinatura">
              <Button size="sm" variant="outline">
                Assinar agora
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={() => setTrialStatus(null)}>
              Fechar
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
} 