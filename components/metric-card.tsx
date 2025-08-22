import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'accent';
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">
          {title}
        </CardTitle>
        <div
          className={`rounded-lg p-2 ${
            variant === 'accent'
              ? 'bg-primary-secondary/10 text-primary'
              : 'bg-primary/10 text-primary'
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        {description && (
          <p className="text-xs text-text-secondary mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
