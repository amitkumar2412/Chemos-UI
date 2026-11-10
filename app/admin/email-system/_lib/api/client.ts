import { tokenStorage } from '@/lib/apiClient';
import type { Paged } from './types';

// Single configurable base; points at the ChemOS server-side proxy, never at the email service itself.
export const EMAIL_API_BASE = process.env.NEXT_PUBLIC_EMAIL_API_BASE ?? '/api/email';

export class EmailApiError extends Error {
  constructor(
    public status: number,
    message?: string
  ) {
    super(message ?? `Request failed (${status})`);
    this.name = 'EmailApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

let redirectingToLogin = false;

function buildUrl(path: string, query?: Query) {
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return `${EMAIL_API_BASE}${path}${qs ? `?${qs}` : ''}`;
}

async function send(method: string, path: string, opts: RequestOptions = {}): Promise<Response> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, cache: 'no-store', signal: opts.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new EmailApiError(0, 'Network error');
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !redirectingToLogin) {
      redirectingToLogin = true;
      tokenStorage.clear();
      window.location.href = '/login';
    }
    throw new EmailApiError(res.status);
  }
  return res;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const emailApi = {
  get: async <T>(path: string, opts?: RequestOptions) => parse<T>(await send('GET', path, opts)),
  post: async <T = void>(path: string, opts?: RequestOptions) => parse<T>(await send('POST', path, opts)),
  put: async <T>(path: string, opts?: RequestOptions) => parse<T>(await send('PUT', path, opts)),
  patch: async <T>(path: string, opts?: RequestOptions) => parse<T>(await send('PATCH', path, opts)),
  delete: async (path: string, opts?: RequestOptions) => {
    await send('DELETE', path, opts);
  },
  // Paged lists expose the X-Total-Count header alongside the items.
  getPaged: async <T>(path: string, opts?: RequestOptions): Promise<Paged<T>> => {
    const res = await send('GET', path, opts);
    const items = await parse<T[]>(res);
    const header = Number(res.headers.get('X-Total-Count'));
    return { items, total: Number.isFinite(header) && res.headers.has('X-Total-Count') ? header : items.length };
  },
};

const FRIENDLY: Record<number, string> = {
  0: 'Could not reach the server. Check your connection and try again.',
  400: 'The request was rejected. Please check the values and try again.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have access to this tool.",
  404: "Not found, or you don't have access.",
  409: 'Your profile has no email address; ask an admin to add one.',
};

export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof EmailApiError) {
    if (FRIENDLY[err.status]) return FRIENDLY[err.status];
    if (err.status >= 500) return 'The email service had a problem. Please retry in a moment.';
  }
  return fallback;
}

export const isStatus = (err: unknown, status: number) => err instanceof EmailApiError && err.status === status;
