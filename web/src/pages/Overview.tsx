import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Link2, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { StatCard } from '../components/ui/StatCard';
import { Chip } from '../components/ui/Chip';

interface Business {
  id: string;
  name: string;
  phoneNumberId: string;
  verified: boolean;
}

export default function Overview() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Business[]>('/api/wa/businesses')
      .then(setBusinesses)
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  const confirmed = businesses.filter((b) => b.verified).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Ringkasan</h1>
        <p className="text-zinc-500 mt-1">Status automasi WhatsApp Anda hari ini.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Bisnis terhubung"
          value={businesses.length}
          hint="Total nomor WhatsApp"
          icon={<Link2 size={18} />}
        />
        <StatCard
          label="Terverifikasi"
          value={confirmed}
          hint="Siap mengirim produksi"
          accent="text-emerald-400"
          icon={<Link2 size={18} />}
        />
        <StatCard
          label="Menunggu tindakan"
          value="-"
          accent="text-ember-400"
          hint="Invoice pending"
          icon={<CreditCard size={18} />}
        />
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Bisnis</h2>
          <Link to="/connect" className="text-sm text-aurora-400 hover:text-aurora-300 inline-flex items-center gap-1">
            Hubungkan
            <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500 py-6 text-center">Memuat...</p>
        ) : businesses.length === 0 ? (
          <div className="text-center py-10">
            <MessageIcon />
            <p className="text-zinc-400 mt-3">Belum ada bisnis terhubung.</p>
            <p className="text-zinc-600 text-sm">Hubungkan nomor WhatsApp pertama Anda.</p>
            <Link to="/connect" className="btn-primary mt-5 inline-flex">
              Hubungkan nomor
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {businesses.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-100 truncate">{b.name}</div>
                  <div className="text-xs text-zinc-500">Phone ID · {b.phoneNumberId}</div>
                </div>
                <Chip tone={b.verified ? 'good' : 'warn'}>{b.verified ? 'Terverifikasi' : 'Pending'}</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MessageIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" className="mx-auto text-ink-700" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}