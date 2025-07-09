import { useCallback } from 'react';
import { Participant, VideoPlayer } from '@zoom/videosdk';
import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore';
import { useAppStore } from '@/useAppStore';
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
  const attach = useZoomSessionStore((s) => s.attachVideoPlayer);
  const detach = useZoomSessionStore((s) => s.detachVideoPlayer);

  const isVideoOn = useAppStore((s) => s.isVideoOn);

  const attachStable = useCallback(
    (el: VideoPlayer) => attach(participant.userId, el),
    [attach, participant.userId]
  );

  const detachStable = useCallback(() => detach(participant.userId), [detach, participant.userId]);

  return (
    <ParticipantTile
      height={height}
      width={width}
      name={participant.displayName}
      isVideoOn={isVideoOn}
    >
      {participant.bVideoOn && <VideoRenderer attach={attachStable} detach={detachStable} />}

      <Corner position="bottom-right" yOffset={6} xOffset={8}>
        <AudioLevelIndicator
          volume={0}
          isTrackEnabled={participant.audio === 'computer' || participant.audio === 'phone'}
        />
      </Corner>
    </ParticipantTile>
  );
}
