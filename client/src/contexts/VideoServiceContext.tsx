import { createContext, ReactNode, useContext } from 'react';
import { IVideoService } from '@/types/IVideoService';

const VideoServiceContext = createContext<IVideoService | null>(null);

interface VideoServiceProviderProps {
  value: IVideoService;
  children: ReactNode;
}

export function VideoServiceProvider({ value, children }: VideoServiceProviderProps) {
  return <VideoServiceContext.Provider value={value}>{children}</VideoServiceContext.Provider>;
}

export function useVideoServiceContext() {
  const context = useContext(VideoServiceContext);
  if (!context) {
    throw new Error('useVideoServiceContext must be used within a VideoServiceProvider');
  }
  return context;
}
