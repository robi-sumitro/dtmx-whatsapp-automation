import { type ReactNode } from 'react';

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'brand';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-white/5 text-zinc-300 border-white/10',
    good: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bad: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    brand: 'bg-aurora-500/10 text-aurora-400 border-aurora-500/20',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}