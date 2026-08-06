import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/ui/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@dtmx.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full grid lg:grid-cols-2 bg-ink-950">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-mesh-light overflow-hidden">
        <div className="flex items-center gap-3">
          <Logo size={38} />
          <span className="font-display text-2xl font-bold text-white">DtmX</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            CS WhatsApp
            <br />
            yang tidak pernah
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-400 to-violet-400"> lengah.</span>
          </h1>
          <p className="mt-4 text-zinc-400">
            Balas pelanggan otomatis, kelola inbox, dan pantau pembayaran —
            semua dari satu panel yang tenang.
          </p>
        </div>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} DtmX Automation</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
            <Logo size={30} />
            <span className="font-display text-xl font-bold text-white">DtmX</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Masuk</h2>
          <p className="mt-1 text-sm text-zinc-500">Akses panel automasi WhatsApp Anda.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Kredensial admin diatur lewat <code className="text-zinc-500">AUTH_EMAIL</code> &{" "}
            <code className="text-zinc-500">AUTH_PASSWORD</code> di server.
          </p>
        </div>
      </div>
    </div>
  );
}