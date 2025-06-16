import { useSingleLayout } from '@/hooks/useSingleLayout';
import { ParticipantTile } from './ParticipantTile';

interface SpotlightViewProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SpotlightView({ containerRef }: SpotlightViewProps) {
  const { height, width } = useSingleLayout(containerRef);

  return (
    <>
      <ParticipantTile height={height} width={width} />
    </>
  );
}
