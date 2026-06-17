import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'purchase' | 'sales' | 'both';

export interface Permission {
  canViewPurchases: boolean;
  canViewSales: boolean;
  canEditPurchases: boolean;
  canEditSales: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    updatePermissions: (state, action: PayloadAction<Permission>) => {
      if (state.user) {
        state.user.permissions = action.payload;
      }
    },
  },
});

export const { login, logout, updatePermissions } = authSlice.actions;
export default authSlice.reducer;
