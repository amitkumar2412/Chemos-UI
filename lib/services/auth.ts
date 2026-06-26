import { apiClient, tokenStorage } from '@/lib/apiClient';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

const USER_KEY = 'chemos_user';

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>('/auth/login', payload);
    tokenStorage.set(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify({ username: data.username, role: data.role }));
    }
    return data;
  },

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
