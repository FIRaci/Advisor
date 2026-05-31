import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isInitializing: boolean;
  setAuth: (user: User | null) => void;
  setInitializing: (val: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitializing: true,
  setAuth: (user) => set({ user, isInitializing: false }),
  setInitializing: (val) => set({ isInitializing: val }),
  logout: () => set({ user: null }),
  isAuthenticated: () => !!get().user
}));

export default useAuthStore;
