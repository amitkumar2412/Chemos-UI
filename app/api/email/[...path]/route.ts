import { NextRequest, NextResponse } from 'next/server';

// Server-to-server proxy to the email service. The browser only ever talks to
// /api/email/*; the API key and identity headers are added here and never shipped
// to the client.

const EMAIL_SERVICE_URL = (process.env.EMAIL_SERVICE_URL ?? 'http://13.206.139.250:8091').replace(/\/+$/, '');
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY ?? '';
const CHEMOS_API = `${(process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/+$/, '')}/api/v1`;

const ALLOWED_RESOURCES = new Set(['mailbox', 'products', 'customers', 'templates', 'campaigns']);
const IDENTITY_TTL_MS = 60_000;

interface Identity {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
}

const identityCache = new Map<string, { identity: Identity; expiresAt: number }>();

class AuthFailure extends Error {
  constructor(public status: number) {
    super('auth failure');
  }
}

async function chemosGet<T>(path: string, authorization: string): Promise<T> {
  const res = await fetch(`${CHEMOS_API}${path}`, {
    headers: { Authorization: authorization, 'ngrok-skip-browser-warning': 'true' },
    cache: 'no-store',
  });
  if (res.status === 401 || res.status === 403) throw new AuthFailure(res.status);
  if (!res.ok) throw new AuthFailure(502);
  return (await res.json()) as T;
}

// The platform token is validated by ChemOS itself; the email-service identity is derived from the
// validated profile, never from anything else the browser supplies.
async function resolveIdentity(authorization: string): Promise<Identity> {
  const cached = identityCache.get(authorization);
  if (cached && cached.expiresAt > Date.now()) return cached.identity;

  const me = await chemosGet<{ user: { username: string; name: string; role: string } }>('/auth/me', authorization);
  const users = await chemosGet<{ id: string; username: string; email?: string | null }[]>('/auth/users', authorization);
  const profile = users.find((u) => u.username === me.user.username);
  if (!profile) throw new AuthFailure(401);

  const identity: Identity = {
    id: profile.id,
    username: me.user.username,
    name: me.user.name,
    email: profile.email ?? '',
    role: me.user.role.toUpperCase(),
  };
  identityCache.set(authorization, { identity, expiresAt: Date.now() + IDENTITY_TTL_MS });
  return identity;
}

// HTTP header values must be Latin-1; encode anything else so a non-Latin display name cannot break the call.
const headerSafe = (value: string) => (/^[\x20-\x7e]*$/.test(value) ? value : encodeURIComponent(value));

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path?.length || !ALLOWED_RESOURCES.has(path[0]) || path.some((s) => s === '..' || s === '.')) {
    return NextResponse.json({ status: 404, error: 'Not Found' }, { status: 404 });
  }
  if (!EMAIL_SERVICE_API_KEY) {
    return NextResponse.json({ status: 500, error: 'Email service API key is not configured' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 });
  }

  let identity: Identity;
  try {
    identity = await resolveIdentity(authorization);
  } catch (err) {
    const status = err instanceof AuthFailure ? err.status : 502;
    return NextResponse.json({ status, error: status === 502 ? 'Bad Gateway' : 'Unauthorized' }, { status });
  }

  const target = `${EMAIL_SERVICE_URL}/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const headers = new Headers({
    'X-API-Key': EMAIL_SERVICE_API_KEY,
    'X-User-Id': identity.id,
    'X-Username': headerSafe(identity.username),
    'X-User-Name': headerSafe(identity.name),
    'X-User-Role': identity.role,
  });
  if (identity.email) headers.set('X-User-Email', headerSafe(identity.email));
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE';
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ status: 502, error: 'Email service unreachable' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of ['content-type', 'x-total-count']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new NextResponse(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
