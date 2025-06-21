import { useCallback } from 'react';
import { Participant, VideoPlayer } from '@zoom/videosdk';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { ParticipantTile } from './ParticipantTile';
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
      <VideoRenderer attach={attachStable} detach={detachStable} />
    </ParticipantTile>
  );
}
