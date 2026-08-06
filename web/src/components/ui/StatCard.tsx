import { type ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  accent = 'text-aurora-400',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-3 group hover:border-aurora-500/30 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        {icon && (
          <span className={`${accent} opacity-80 group-hover:opacity-100 transition-opacity`}>
            {icon}
          </span>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-zinc-50 leading-none">{value}</div>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}