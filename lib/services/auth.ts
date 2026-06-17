import { apiClient, tokenStorage } from '@/lib/apiClient';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>('/auth/login', payload);
    tokenStorage.set(data.token);
    return data;
  },

  logout: () => {
    tokenStorage.clear();
  },
};
