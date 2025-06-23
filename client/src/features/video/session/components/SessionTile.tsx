import { useCallback } from 'react';
import { Participant, VideoPlayer } from '@zoom/videosdk';
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

  const attachStable = useCallback(
    (el: VideoPlayer) => attach(participant.userId, el),
    [attach, participant.userId]
  );

  const detachStable = useCallback(() => detach(participant.userId), [detach, participant.userId]);

  return (
    <ParticipantTile height={height} width={width} name={participant.displayName}>
      {participant.bVideoOn && <VideoRenderer attach={attachStable} detach={detachStable} />}

      <Corner position="bottom-right">
        <AudioLevelIndicator
          volume={0}
          isTrackEnabled={participant.audio === 'computer' || participant.audio === 'phone'}
        />
      </Corner>
    </ParticipantTile>
  );
}
