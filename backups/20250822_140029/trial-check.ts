import { createClient } from '@/lib/supabase/server';

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  daysLeft: number;
  trialEnd: string | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  try {
    const supabase = await createClient();
    
    const { data: profile, error } = await supabase
      .from('company_profiles')
      .select('trial_end, status')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return {
        isActive: false,
        isExpired: true,
        daysLeft: 0,
        trialEnd: null,
        status: 'expired'
      };
    }

    const now = new Date();
    const trialEnd = new Date(profile.trial_end);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = now > trialEnd;

    return {
      isActive: !isExpired && profile.status === 'trial',
      isExpired,
      daysLeft: Math.max(0, daysLeft),
      trialEnd: profile.trial_end,
      status: profile.status as 'trial' | 'active' | 'expired' | 'cancelled'
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") { console.error('Erro ao verificar status do trial:', error); }
    return {
      isActive: false,
      isExpired: true,
      daysLeft: 0,
      trialEnd: null,
      status: 'expired'
    };
  }
}

export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) {
    return 'Hoje é o último dia';
  } else if (daysLeft === 1) {
    return '1 dia restante';
  } else {
    return `${daysLeft} dias restantes`;
  }
} 