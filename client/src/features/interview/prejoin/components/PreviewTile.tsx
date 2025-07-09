import { useEffect, useState } from 'react';
import { Corner } from '@/components/Corner';
import { usePreviewStore } from '@/features/interview/prejoin/hooks/usePreviewStore';
import { useAppStore } from '@/useAppStore';
import AudioLevelIndicator from '../../components/AudioLevelIndicator';
import { ParticipantTile } from '../../components/ParticipantTile';
import { VideoRenderer } from '../../session/components/VideoRenderer';

interface PreviewTileProps {
  height: number;
  width: number;
  name: string;
}

export function PreviewTile({ height, width, name }: PreviewTileProps) {
  const permissionState = useAppStore((s) => s.permissionState);
  const startCamera = usePreviewStore((s) => s.startCamera);
  const stopCamera = usePreviewStore((s) => s.stopCamera);

  const startMicrophone = usePreviewStore((s) => s.startMicrophone);

  const localAudioTrack = usePreviewStore((s) => s.localAudioTrack);

  const isVideoOn = useAppStore((s) => s.isVideoOn);
  const isAudioOn = useAppStore((s) => s.isAudioOn);

  const [volume, setVolume] = useState(0);

  useEffect(() => {
    async function startMic() {
      if (permissionState === 'granted') {
        await startMicrophone();
      }
    }

    startMic();
  }, [permissionState, startMicrophone]);

  // polling to update volume indicator
  useEffect(() => {
    let interval: number;
    if (localAudioTrack) {
      interval = window.setInterval(() => {
        const volume = localAudioTrack.getCurrentVolume();
        setVolume(volume);
      }, 200);
    }
    return () => {
      clearInterval(interval);
    };
  }, [localAudioTrack]);

  return (
    <ParticipantTile height={height} width={width} name={name} isVideoOn={isVideoOn}>
      {permissionState === 'granted' && isVideoOn && (
        <VideoRenderer attach={startCamera} detach={stopCamera} />
      )}

      <Corner position="bottom-right" yOffset={6} xOffset={8}>
        <AudioLevelIndicator volume={volume || 0} isTrackEnabled={isAudioOn} />
      </Corner>
    </ParticipantTile>
  );
}
