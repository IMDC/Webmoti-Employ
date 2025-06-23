import { useCallback } from 'react';
import { Participant, VideoPlayer } from '@zoom/videosdk';
import { useAppStore } from '@/stores/store';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { Corner } from '../../../../components/Corner';
import AudioLevelIndicator from '../../components/AudioLevelIndicator';
import { ParticipantTile } from '../../components/ParticipantTile';
import { VideoRenderer } from './VideoRenderer';

interface SessionTileProps {
  height: number;
  width: number;
  participant: Participant;
}

export function SessionTile({ height, width, participant }: SessionTileProps) {
  const attach = useZoomVideoStore((s) => s.attachVideoPlayer);
  const detach = useZoomVideoStore((s) => s.detachVideoPlayer);

  const permissionState = useAppStore((s) => s.permissionState);

  const isAudioOn = useAppStore((s) => s.isAudioOn);

  const attachStable = useCallback(
    (el: VideoPlayer) => attach(participant.userId, el),
    [attach, participant.userId]
  );

  const detachStable = useCallback(() => detach(participant.userId), [detach, participant.userId]);

  return (
    <ParticipantTile height={height} width={width} name={participant.displayName}>
      {permissionState === 'granted' && (
        <VideoRenderer attach={attachStable} detach={detachStable} />
      )}

      <Corner position="bottom-right">
        <AudioLevelIndicator
          volume={0}
          isTrackEnabled={isAudioOn && permissionState === 'granted'}
        />
      </Corner>
    </ParticipantTile>
  );
}
