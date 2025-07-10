import { Box } from '@mantine/core'
import { GALLERY_VIEW_MARGIN } from '@/utils/constants'

export function SpotlightView() {
  return (
    <>
      <Box
        style={{
          width: '100%',
          height: '100%',
          margin: GALLERY_VIEW_MARGIN,
          position: 'relative',
        }}
      >
        {/* <ParticipantTile width="100%" height="100%" />

        <AspectRatio
          ratio={16 / 9}
          w={250}
          style={{
            position: 'absolute',
            bottom: 15,
            right: 15,
          }}
        >
          <ParticipantTile width="100%" height="100%" />
        </AspectRatio> */}
      </Box>
    </>
  )
}
