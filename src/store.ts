import { create } from 'zustand';

type AppStore = {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export const useAppStore = create<AppStore>((set) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
