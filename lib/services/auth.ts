import { apiClient, tokenStorage } from '@/lib/apiClient';

export interface LoginPayload {
  username: string;
  password: string;
}

export type LoginStatus = 'ENROLLMENT_REQUIRED' | 'VERIFICATION_REQUIRED';

export interface LoginInitResponse {
  status: LoginStatus;
  preAuthToken: string;
  username: string;
}

export interface EnrollInitResponse {
  secretBase32: string;
  otpauthUri: string;
}

export interface AuthResult {
  token: string;
  username: string;
  role: string;
}

export interface EnrollConfirmResponse extends AuthResult {
  backupCodes: string[];
}

export interface AdminReset2faResponse {
  username: string;
  totpEnabled: boolean;
  backupCodesRemaining: number;
}

export interface ModuleAccess {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

export interface MeResponse {
  user: { username: string; name: string; role: string; roleDisplayName: string };
  permissions: string[];
  modules: Record<string, ModuleAccess>;
}

const USER_KEY = 'chemos_user';

const preAuthHeaders = (preAuthToken: string) => ({
  headers: { Authorization: `Bearer ${preAuthToken}` },
});

const completeLogin = (result: AuthResult): AuthResult => {
  tokenStorage.set(result.token);
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify({ username: result.username, role: result.role }));
  }
  return result;
};

export const authService = {
  login: (payload: LoginPayload): Promise<LoginInitResponse> =>
    apiClient.post<LoginInitResponse>('/auth/login', payload),

  enrollInit: (preAuthToken: string): Promise<EnrollInitResponse> =>
    apiClient.post<EnrollInitResponse>('/auth/2fa/enroll/init', undefined, preAuthHeaders(preAuthToken)),

  enrollConfirm: async (preAuthToken: string, code: string): Promise<EnrollConfirmResponse> => {
    const data = await apiClient.post<EnrollConfirmResponse>(
      '/auth/2fa/enroll/confirm',
      { code },
      preAuthHeaders(preAuthToken)
    );
    completeLogin(data);
    return data;
  },

  verifyLogin: async (preAuthToken: string, code: string): Promise<AuthResult> => {
    const data = await apiClient.post<AuthResult>(
      '/auth/2fa/login/verify',
      { code },
      preAuthHeaders(preAuthToken)
    );
    completeLogin(data);
    return data;
  },

  me: (): Promise<MeResponse> => apiClient.get<MeResponse>('/auth/me'),

  adminReset2fa: (username: string): Promise<AdminReset2faResponse> =>
    apiClient.patch<AdminReset2faResponse>(`/auth/users/${encodeURIComponent(username)}/2fa/reset`),

  logout: () => {
    tokenStorage.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  getStoredUser: (): { username: string; role: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
