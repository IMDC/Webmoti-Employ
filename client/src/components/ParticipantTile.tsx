import { Participant } from '@zoom/videosdk';
import { Avatar, Box, Card, Center, Text } from '@mantine/core';
import AudioLevelIndicator from './AudioLevelIndicator';
import { Corner } from './participant/Corner';
import { NoVideoBackground } from './participant/NoVideoBackground';
import { VideoRenderer } from './VideoRenderer';

interface ParticipantTileProps {
  height: number | string;
  width: number | string;
  participant: Participant;
}

export function ParticipantTile({ height, width, participant }: ParticipantTileProps) {
  return (
    <Card
      h={height}
      w={width}
      p={0}
      radius="lg"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* {!participant.bVideoOn && <NoVideoBackground />} */}

      {participant.bVideoOn ? <VideoRenderer userId={participant.userId} /> : <NoVideoBackground />}

      <Corner>
        <Text size="sm" c="white">
          {participant.displayName}
        </Text>
      </Corner>

      {/* {mediaStreamTrack && (
        <Corner>
          <AudioLevelIndicator mediaStreamTrack={mediaStreamTrack} isTrackEnabled={!isMuted} />
        </Corner>
      )} */}
    </Card>
  );
}
