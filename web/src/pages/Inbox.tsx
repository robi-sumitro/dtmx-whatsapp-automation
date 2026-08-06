import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Chip } from '../components/ui/Chip';

interface Conversation {
  id: string;
  waRecipient: string;
  customerName?: string | null;
  state: string;
  isAiEnabled: boolean;
  messages: Array<{ direction: string; body: string; sentAt: string }>;
}

export default function Inbox() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: Conversation[] }>('/api/wa/conversations?businessId=')
      .then((d) => setConvs(d.items))
      .catch(() => setConvs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-white">Inbox</h1>
        <p className="text-zinc-500 mt-1">Semua percakapan pelanggan WhatsApp.</p>
      </header>

      {loading ? (
        <p className="text-sm text-zinc-500 py-10 text-center">Memuat percakapan...</p>
      ) : convs.length === 0 ? (
        <div className="card py-14 text-center space-y-2">
          <MessageCircle size={34} className="mx-auto text-ink-700" />
          <p className="text-zinc-400">Belum ada percakapan.</p>
          <p className="text-zinc-600 text-sm">
            Setelah nomor terhubung & pelanggan mengirim pesan, percakapan muncul di sini.
          </p>
        </div>
      ) : (
        <ul className="card divide-y divide-white/5">
          {convs.map((c) => {
            const last = c.messages[0];
            return (
              <li key={c.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100 truncate">
                      {c.customerName || c.waRecipient}
                    </span>
                    {c.isAiEnabled && <Chip tone="brand">AI</Chip>}
                  </div>
                  <div className="text-sm text-zinc-500 truncate mt-0.5">
                    {last?.direction === 'INBOUND' ? 'Pelanggan: ' : 'Bot: '}
                    {last?.body || 'Belum ada pesan'}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Chip tone="neutral">{stateLabel(c.state)}</Chip>
                  {last && (
                    <div className="text-xs text-zinc-600 mt-1.5">
                      {new Date(last.sentAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function stateLabel(state: string) {
  switch (state) {
    case 'GREETING':
      return 'Salam';
    case 'MENU':
      return 'Menu';
    case 'QUOTE':
      return 'Penawaran';
    case 'CLOSE':
      return 'Selesai';
    default:
      return state;
  }
}