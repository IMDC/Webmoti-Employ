import { useZoomPreviewStore } from '@/stores/ZoomPreviewStore';
import { ParticipantTile } from './ParticipantTile';
import { VideoRenderer } from './VideoRenderer';

interface PreviewTileProps {
  height: number;
  width: number;
}

export function PreviewTile({ height, width }: PreviewTileProps) {
  const cameraPermission = useZoomPreviewStore((s) => s.cameraPermission);
  const startCamera = useZoomPreviewStore((s) => s.startCamera);
  const stopCamera = useZoomPreviewStore((s) => s.stopCamera);

  return (
    <ParticipantTile height={height} width={width} name="You">
      {cameraPermission === 'granted' && <VideoRenderer attach={startCamera} detach={stopCamera} />}
    </ParticipantTile>
  );
}
