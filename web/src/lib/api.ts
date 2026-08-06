const TOKEN_KEY = 'dtmx_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  message: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(t: string | null) {
    this.token = t;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (extra) Object.assign(h, extra);
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try {
        const data = (await res.json()) as Partial<ApiError>;
        if (data.message) msg = data.message;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(path, { headers: this.headers() });
    return this.parse<T>(res);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return this.parse<T>(res);
  }
}

export const api = new ApiClient();

export async function login(email: string, password: string) {
  const data = await api.post<{ accessToken: string }>('/api/auth/login', {
    email,
    password,
  });
  setToken(data.accessToken);
  api.setToken(data.accessToken);
  return data;
}

export function logout() {
  clearToken();
  api.setToken(null);
}

// Bootstrap: muat token dari storage saat app start.
const initial = getToken();
if (initial) api.setToken(initial);