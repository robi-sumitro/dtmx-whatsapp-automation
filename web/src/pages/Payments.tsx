import { useEffect, useState, type FormEvent } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../lib/api';
import { Chip } from '../components/ui/Chip';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  note?: string | null;
  businessId: string;
  business: { name: string } | null;
  proofs: Array<{ id: string; fileUrl: string; note?: string | null }>;
}

export default function Payments() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [manualInfo, setManualInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({ businessId: '', amount: '', note: '' });

  useEffect(() => {
    Promise.all([
      api.get<Invoice[]>('/api/payments/invoices').then(setInvoices).catch(() => setInvoices([])),
      api
        .get<Record<string, string>>('/api/payments/manual-info')
        .then(setManualInfo)
        .catch(() => setManualInfo({})),
    ]).finally(() => setLoading(false));
  }, []);

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    if (!form.businessId || !form.amount) return;
    await api.post('/api/payments/invoices', {
      businessId: form.businessId,
      amount: Number(form.amount),
      note: form.note,
    });
    setForm({ businessId: '', amount: '', note: '' });
    const list = await api.get<Invoice[]>('/api/payments/invoices');
    setInvoices(list);
  }

  async function setStatus(id: string, status: 'PAID' | 'REJECTED') {
    setBusyId(id);
    try {
      await api.post(`/api/payments/invoices/${id}/${status === 'PAID' ? 'confirm' : 'reject'}`, {});
      const list = await api.get<Invoice[]>('/api/payments/invoices');
      setInvoices(list);
    } finally {
      setBusyId(null);
    }
  }

  const bankWorth = Object.entries(manualInfo).length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Pembayaran</h1>
        <p className="text-zinc-500 mt-1">Tangani pembayaran manual pelanggan.</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form buat invoice */}
        <form onSubmit={createInvoice} className="card p-6 space-y-4 lg:col-span-2 self-start">
          <h2 className="font-display text-lg font-semibold text-white">Buat invoice</h2>
          <Field label="Nama / ID bisnis">
            <input className="input" placeholder="Bisnis" value={form.businessId} onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))} required />
          </Field>
          <Field label="Jumlah (IDR)">
            <input className="input" type="number" min={0} placeholder="199000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
          </Field>
          <Field label="Catatan">
            <input className="input" placeholder="opsional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </Field>
          <button type="submit" className="btn-primary w-full">Buat tagihan</button>

          <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Info rekening tujuan</div>
            {bankWorth ? (
              <dl className="space-y-1 text-sm text-zinc-300">
                {Object.entries(manualInfo).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-zinc-500 capitalize">{k.replaceAll('_', ' ')}</dt><dd className="text-zinc-200">{v || '-'}</dd></div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-zinc-600">Rekening belum dikonfigurasi.</p>
            )}
          </div>
        </form>

        {/* Daftar invoice */}
        <div className="lg:col-span-3 card p-6 self-start space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Invoice</h2>
          {loading ? (
            <p className="text-sm text-zinc-500 py-8 text-center">Memuat...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-zinc-600 py-8 text-center">Belum ada invoice.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {invoices.map((inv) => (
                <li key={inv.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-100">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: inv.currency }).format(inv.amount)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{inv.business?.name || inv.note}</div>
                    {inv.proofs.length > 0 && (
                      <div className="text-xs text-aurora-400 mt-1">{inv.proofs.length} bukti terlampir</div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Chip tone={toneOf(inv.status)}>{inv.status}</Chip>
                    {inv.status === 'PENDING' && (
                      <>
                        <button onClick={() => setStatus(inv.id, 'PAID')} disabled={busyId === inv.id} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors" aria-label="Setujui"><Check size={15} /></button>
                        <button onClick={() => setStatus(inv.id, 'REJECTED')} disabled={busyId === inv.id} className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors" aria-label="Tolak"><X size={15} /></button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function toneOf(s: string): 'good' | 'neutral' | 'bad' {
  if (s === 'PAID') return 'good';
  if (s === 'REJECTED') return 'bad';
  return 'neutral';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}