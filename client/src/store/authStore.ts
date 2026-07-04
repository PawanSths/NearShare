import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    role: string;
  } | null;
  setAuth: (token: string | null, user: AuthState['user']) => void;
  clearAuth: () => void;
}

const STORAGE_KEY = 'nearbeat-auth';

const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

const initialState = persisted
  ? JSON.parse(persisted)
  : { token: null, user: null };

export const useAuthStore = create<AuthState>((set) => ({
  token: initialState.token,
  user: initialState.user,
  setAuth: (token, user) => {
    set({ token, user });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    }
  },
  clearAuth: () => {
    set({ token: null, user: null });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
