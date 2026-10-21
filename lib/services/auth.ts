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
  dashboardVisible: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  isActive: boolean;
  name: string;
  email: string;
  role: string;
  roleDisplay: string;
  permissions: string[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  roleId: string;
  name: string;
  email: string;
}

export interface UpdateUserPayload {
  roleId: string;
  name: string;
  email: string;
  newPassword?: string;
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

  me: async (): Promise<MeResponse> => {
    const raw = await apiClient.get<{
      user: MeResponse['user'];
      permissions: string[];
      modules: Record<string, ModuleAccess | boolean>;
    }>('/auth/me');
    const { dashboardVisible, ...modules } = raw.modules;
    return {
      user: raw.user,
      permissions: raw.permissions,
      modules: modules as Record<string, ModuleAccess>,
      dashboardVisible: dashboardVisible === true,
    };
  },

  adminReset2fa: (username: string): Promise<AdminReset2faResponse> =>
    apiClient.patch<AdminReset2faResponse>(`/auth/users/${encodeURIComponent(username)}/2fa/reset`),

  getUsers: (): Promise<UserResponse[]> => apiClient.get<UserResponse[]>('/auth/users'),

  getUserById: (id: string): Promise<UserResponse> =>
    apiClient.get<UserResponse>(`/auth/users/${encodeURIComponent(id)}`),

  createUser: (payload: CreateUserPayload): Promise<UserResponse> =>
    apiClient.post<UserResponse>('/auth/users', payload),

  updateUser: (username: string, payload: UpdateUserPayload): Promise<UserResponse> =>
    apiClient.patch<UserResponse>(`/auth/users/${encodeURIComponent(username)}`, payload),

  toggleUser: (username: string): Promise<UserResponse> =>
    apiClient.patch<UserResponse>(`/auth/users/${encodeURIComponent(username)}/toggle`),

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
