'use client';

import { RiskLevel, Status } from '@/types';

interface BadgeProps {
  label: string;
  variant?: 'status' | 'risk' | 'default' | 'blue' | 'orange' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const variantStyles: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  green: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  red: 'bg-red-500/20 text-red-300 border border-red-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  gray: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  default: 'bg-slate-700/50 text-slate-300 border border-slate-600/30',
};

type BadgeVariant = 'status' | 'risk' | 'default' | 'blue' | 'orange' | 'green' | 'red' | 'yellow' | 'gray';

export function statusVariant(status: Status): BadgeVariant {
  switch (status) {
    case 'verified': return 'green';
    case 'active': return 'blue';
    case 'pending': return 'yellow';
    case 'flagged': return 'red';
    case 'rejected': return 'red';
    default: return 'gray';
  }
}

export function riskVariant(risk: RiskLevel): BadgeVariant {
  switch (risk) {
    case 'low': return 'green';
    case 'medium': return 'yellow';
    case 'high': return 'orange';
    case 'critical': return 'red';
    default: return 'gray';
  }
}

export default function Badge({ label, variant = 'default', size = 'sm', pulse }: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.default;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${styles}`}>
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${variant === 'green' ? 'bg-emerald-400' : variant === 'red' ? 'bg-red-400' : variant === 'yellow' ? 'bg-yellow-400' : 'bg-blue-400'} status-pulse`} />
      )}
      {label}
    </span>
  );
}
