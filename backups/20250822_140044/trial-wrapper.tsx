'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TrialNotification } from './trial-notification';

interface TrialWrapperProps {
  children: React.ReactNode;
}

export function TrialWrapper({ children }: TrialWrapperProps) {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<{ trialEnd: string; companyName: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadTrialData();
    }
  }, [user]); // Apenas user como dependência

  const loadTrialData = async () => {
    try {
      const response = await fetch('/api/company/profile');
      const { data: profile } = await response.json();
      
      if (profile && profile.status === 'trial') {
        setTrialData({
          trialEnd: profile.trial_end,
          companyName: profile.company_name
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do trial:', error);
    }
  };

  return (
    <div>
      {trialData && (
        <TrialNotification 
          trialEnd={trialData.trialEnd} 
          companyName={trialData.companyName} 
        />
      )}
      {children}
    </div>
  );
} 