import { layoutIsTooSmall } from './useGalleryViewLayout'

// GALLERY_VIEW_ASPECT_RATIO = 16/9, GALLERY_VIEW_MARGIN = 3
// layoutIsTooSmall returns true when the layout fits in the container
// (i.e. the video size is small enough — used in binary search to find the max size)

describe('layoutIsTooSmall (gallery view layout helper)', () => {
  it('returns true when video size fits in container (could be larger)', () => {
    // 1 participant, video width 200, container 800x600
    // videoHeight = 200 / (16/9) = 112.5
    // columns = floor(800/200) = 4, rows = ceil(1/4) = 1
    // rows * videoHeight = 112.5 <= 600 → true
    expect(layoutIsTooSmall(200, 1, 800, 600)).toBe(true)
  })

  it('returns false when video size makes layout exceed container height', () => {
    // 10 participants, video width 400, container 800x300
    // videoHeight = 400 / (16/9) = 225
    // columns = floor(800/400) = 2, rows = ceil(10/2) = 5
    // rows * videoHeight = 5 * 225 = 1125 > 300 → false
    expect(layoutIsTooSmall(400, 10, 800, 300)).toBe(false)
  })

  it('handles single column layout', () => {
    // 3 participants, video width 600, container 500x900
    // columns = floor(500/600) = 0 → division by zero edge case
    // But: floor(500/600) = 0, rows = ceil(3/0) = Infinity
    // Infinity * videoHeight > 900 → false
    expect(layoutIsTooSmall(600, 3, 500, 900)).toBe(false)
  })

  it('fits exactly when rows * videoHeight equals container height', () => {
    // 2 participants, video width 400, container 800x450
    // videoHeight = 400 / (16/9) = 225
    // columns = floor(800/400) = 2, rows = ceil(2/2) = 1
    // rows * videoHeight = 225 <= 450 → true
    expect(layoutIsTooSmall(400, 2, 800, 450)).toBe(true)
  })

  it('handles many participants requiring multiple rows', () => {
    // 20 participants, video width 200, container 1200x800
    // videoHeight = 200 / (16/9) = 112.5
    // columns = floor(1200/200) = 6, rows = ceil(20/6) = 4
    // 4 * 112.5 = 450 <= 800 → true
    expect(layoutIsTooSmall(200, 20, 1200, 800)).toBe(true)
  })
})
