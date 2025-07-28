import { Box } from '@mantine/core'
import { GALLERY_VIEW_MARGIN } from '@/utils/constants'

export function SpotlightView() {
  return (
    <>
      <Box
        w="100%"
        h="100%"
        m={GALLERY_VIEW_MARGIN}
        pos="relative"
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
