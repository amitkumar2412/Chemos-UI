/**
 * API Client with 401 Interceptor
 * 
 * This client automatically handles expired/invalid JWT tokens by intercepting 401 responses.
 * 
 * Key behaviors:
 * 
 * 1. When a 401 is received from ANY protected endpoint (not the login endpoint):
 *    - Clears stored token and user data from localStorage
 *    - Redirects to /login page (full page reload, which resets Redux state)
 *    - Guard flag prevents multiple simultaneous redirects if 5 requests 401 at once
 * 
 * 2. When a 401 is received from the LOGIN endpoint itself:
 *    - Just throws the error normally (this is "wrong username/password", not expired session)
 *    - No redirect, no token clearing
 * 
 * 3. When a 403 is received (valid token, wrong permissions):
 *    - Just throws the error normally (shows "access denied" message)
 *    - Does NOT log user out or redirect
 * 
 * The backend's authenticationEntryPoint correctly returns 401 for expired/invalid/missing tokens,
 * so no backend changes are needed for this to work.
 * 
 * Future enhancement: Add refresh token support on top of this same interceptor logic.
 */

const BASE_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://35.154.133.62:8082') + '/api/v1';

const TOKEN_KEY = 'chemos_token';
const USER_KEY = 'chemos_user';

// Guard flag to prevent multiple simultaneous redirects when multiple requests 401 at once
let isRedirectingToLogin = false;

// Persist JWT outside React tree so apiClient can read it anywhere
export const tokenStorage = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  set: (token: string): void => {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  config: RequestConfig = {}
): Promise<T> {
  const { headers = {}, params, cache } = config;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const search = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    );
    url = `${url}?${search}`;
  }

  const token = tokenStorage.get();

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(cache ? { cache } : { cache: 'no-store' }),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    // Handle 401 Unauthorized - expired or invalid token
    if (res.status === 401) {
      const isLoginRequest = endpoint === '/auth/login';
      
      // If this is NOT the login endpoint, it means a valid session just died
      // (expired/invalid/tampered token) - clear auth state and redirect to login
      if (!isLoginRequest && typeof window !== 'undefined') {
        // Guard against multiple simultaneous redirects (race condition)
        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          
          // Clear all auth-related data
          tokenStorage.clear();
          localStorage.removeItem(USER_KEY);
          
          // Redirect to login page (causes full page reload, resetting Redux state)
          window.location.href = '/login';
        }
        
        // Still throw the error for the calling code to handle if needed
        throw new ApiError(res.status, 'Session expired. Please log in again.');
      }
      
      // If this IS the login endpoint, just throw the error normally
      // (this is a "wrong username/password" case, not an expired session)
    }
    
    // For all other errors (including 403 Forbidden for "wrong permissions"),
    // just throw normally without redirecting
    throw new ApiError(res.status, data.message ?? data.detail ?? 'Request failed');
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>('GET', endpoint, undefined, config),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('POST', endpoint, body, config),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PUT', endpoint, body, config),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', endpoint, body, config),

  delete: <T = void>(endpoint: string, config?: RequestConfig) =>
    request<T>('DELETE', endpoint, undefined, config),
};
