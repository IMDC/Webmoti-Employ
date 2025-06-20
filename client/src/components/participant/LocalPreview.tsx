import { Card } from '@mantine/core';
import { VideoRenderer } from '../VideoRenderer';

interface LocalPreviewProps {
  height: number | string;
  width: number | string;
  attach?: (element: HTMLElement) => void;
}

export function LocalPreview({ height, width, attach }: LocalPreviewProps) {
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

      <VideoRenderer attach={attach} />

      {/* <Corner>
        <Text size="sm" c="white">
          {participant.displayName}
        </Text>
      </Corner> */}

      {/* {mediaStreamTrack && (
        <Corner>
          <AudioLevelIndicator mediaStreamTrack={mediaStreamTrack} isTrackEnabled={!isMuted} />
        </Corner>
      )} */}
    </Card>
  );
}
