import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';

export interface ModuleAccess {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

export interface PermissionsState {
  permissions: string[];
  modules: Record<string, ModuleAccess>;
  dashboardVisible: boolean;
  status: 'idle' | 'loading' | 'loaded' | 'error';
}

const initialState: PermissionsState = {
  permissions: [],
  modules: {},
  dashboardVisible: false,
  status: 'idle',
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissionsLoading: (state) => {
      state.status = 'loading';
    },
    setPermissions: (
      state,
      action: PayloadAction<{ permissions: string[]; modules: Record<string, ModuleAccess>; dashboardVisible: boolean }>
    ) => {
      state.permissions = action.payload.permissions;
      state.modules = action.payload.modules;
      state.dashboardVisible = action.payload.dashboardVisible;
      state.status = 'loaded';
    },
    setPermissionsError: (state) => {
      state.status = 'error';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setPermissionsLoading, setPermissions, setPermissionsError } = permissionsSlice.actions;
export default permissionsSlice.reducer;
