import { getSubscription } from '@/lib/subscription/actions';
import { SubscriptionDashboard } from '@/components/subscription/subscription-dashboard';
import { redirect } from 'next/navigation';

export default async function SubscriptionDashboardPage() {
  const subscription = await getSubscription();
  
  if (!subscription) {
    redirect('/assinatura');
  }

  return <SubscriptionDashboard subscription={subscription} />;
} 