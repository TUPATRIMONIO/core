/**
 * StatsCard Component
 * Card para mostrar KPIs del dashboard
 */

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/crm/formatters';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  format?: 'number' | 'currency';
  currency?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  format = 'number',
  currency = 'CLP'
}: StatsCardProps) {
  const formattedValue = format === 'currency' && typeof value === 'number'
    ? formatCurrency(value, currency)
    : value.toLocaleString();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="w-8 h-8 bg-[var(--tp-brand)]/10 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--tp-brand)]" />
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formattedValue}
          </p>
          {trend && (
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}



