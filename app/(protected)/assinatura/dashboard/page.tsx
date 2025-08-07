import { getSubscription } from '@/lib/subscription/actions';
import { SubscriptionDashboard } from '@/components/subscription/subscription-dashboard';
import { redirect } from 'next/navigation';

// Forçar renderização dinâmica para evitar erro de cookies durante build estático
export const dynamic = 'force-dynamic';

export default async function SubscriptionDashboardPage() {
  const subscription = await getSubscription();
  
  if (!subscription) {
    redirect('/assinatura');
  }

  return <SubscriptionDashboard subscription={subscription} />;
} 