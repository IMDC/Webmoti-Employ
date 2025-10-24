import type { AvatarProps } from '@mantine/core'
import { Avatar } from '@mantine/core'

export function GoogleAvatar({ ...props }: AvatarProps) {
  return (
    <Avatar
      draggable={false}
      // this policy fixes an issue where the profile doesn't show due to a cache issue
      imageProps={{ referrerPolicy: 'no-referrer' }}
      {...props}
    />
  )
}
