import { AuthGuard } from '@/components/auth-guard';
import { TrialGuard } from '@/components/trial-guard';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TrialGuard>{children}</TrialGuard>
    </AuthGuard>
  );
}
