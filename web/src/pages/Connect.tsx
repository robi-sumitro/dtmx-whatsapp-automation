import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { api } from '../lib/api';

export default function Connect() {
  const [form, setForm] = useState({
    businessName: '',
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.post('/api/wa/connect', form);
      setMsg({ ok: true, text: 'Nomor berhasil dihubungkan. Cek tab Ringkasan.' });
      setForm({ businessName: '', phoneNumberId: '', wabaId: '', accessToken: '' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal menghubungkan' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Hubungkan nomor</h1>
        <p className="text-zinc-500 mt-1">
          Sambungkan WhatsApp Business Anda. Butuh bantuan menyiapkan token?
          lihat <span className="text-aurora-400">docs/GO-LIVE-META.md</span>.
        </p>
      </header>

      <form onSubmit={onSubmit} className="card p-6 space-y-5">
        <Field label="Nama bisnis">
          <input
            className="input"
            placeholder="Contoh: Studio Rapi"
            value={form.businessName}
            onChange={(e) => update('businessName', e.target.value)}
            required
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Phone Number ID">
            <input
              className="input"
              placeholder="104789... (Meta)"
              value={form.phoneNumberId}
              onChange={(e) => update('phoneNumberId', e.target.value)}
              required
            />
          </Field>
          <Field label="WABA ID">
            <input
              className="input"
              placeholder="Web WhatsApp Business Acc. ID"
              value={form.wabaId}
              onChange={(e) => update('wabaId', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Access Token">
          <input
            className="input"
            type="password"
            placeholder="System user token"
            value={form.accessToken}
            onChange={(e) => update('accessToken', e.target.value)}
            required
          />
        </Field>

        {msg && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              msg.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {msg.ok && <Check size={15} className="inline mr-1.5" />}
            {msg.text}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan & aktifkan'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}