import { useEffect, useState } from 'react';
import { Corner } from '@/components/Corner';
import { useAppStore } from '@/stores/useAppStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import AudioLevelIndicator from '../../components/AudioLevelIndicator';
import { ParticipantTile } from '../../components/ParticipantTile';
import { VideoRenderer } from '../../session/components/VideoRenderer';

interface PreviewTileProps {
  height: number;
  width: number;
}

export function PreviewTile({ height, width }: PreviewTileProps) {
  const permissionState = useAppStore((s) => s.permissionState);
  const startCamera = useZoomPreviewStore((s) => s.startCamera);
  const stopCamera = useZoomPreviewStore((s) => s.stopCamera);

  const startMicrophone = useZoomPreviewStore((s) => s.startMicrophone);

  const localAudioTrack = useZoomPreviewStore((s) => s.localAudioTrack);

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
    <ParticipantTile height={height} width={width} name="You">
      {permissionState === 'granted' && isVideoOn && (
        <VideoRenderer attach={startCamera} detach={stopCamera} />
      )}

      <Corner position="bottom-right">
        <AudioLevelIndicator volume={volume || 0} isTrackEnabled={isAudioOn} />
      </Corner>
    </ParticipantTile>
  );
}
