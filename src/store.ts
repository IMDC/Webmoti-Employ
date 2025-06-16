import { create } from 'zustand';

type AppStore = {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;

  isAudioOn: boolean;
  isVideoOn: boolean;
  setIsAudioOn: (value: boolean) => void;
  setIsVideoOn: (value: boolean) => void;
  toggleIsAudioOn: () => void;
  toggleIsVideoOn: () => void;

  isMediaDenied: boolean;
  setIsMediaDenied: (value: boolean) => void;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (value: boolean) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  isAudioOn: true,
  isVideoOn: true,
  setIsAudioOn: (value) => set({ isAudioOn: value }),
  setIsVideoOn: (value) => set({ isVideoOn: value }),
  toggleIsAudioOn: () => set({ isAudioOn: !get().isAudioOn }),
  toggleIsVideoOn: () => set({ isVideoOn: !get().isVideoOn }),

  isMediaDenied: false,
  setIsMediaDenied: (value) => set({ isMediaDenied: value }),

  isSettingsOpen: false,
  setIsSettingsOpen: (value) => set({ isSettingsOpen: value }),
}));
