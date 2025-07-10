import type { VideoPlayer, VideoPlayerContainer } from '@zoom/videosdk'
import type { DetailedHTMLProps, DOMAttributes, HTMLAttributes } from 'react'

type CustomElement<T> = Partial<T & DOMAttributes<T> & { children?: any }>

// these custom elements are required by the zoom sdk

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'video-player': DetailedHTMLProps<HTMLAttributes<VideoPlayer>, VideoPlayer> & {
        class?: string
      }
      'video-player-container': CustomElement<VideoPlayerContainer> & { class?: string }
    }
  }
}
export {}
