import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass: string;
}

const StatsCard = ({ title, value, subtitle, icon: Icon, trend, colorClass }: StatsCardProps) => {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 bg-gradient-to-br ${colorClass}`}>
      {/* Background Icon */}
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Icon className="h-16 w-16" />
      </div>
      
      <div className="relative">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <span className={`text-xs font-medium mb-1 ${
              trend.isPositive ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
