import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { notifyError, notifySuccess } from '@/utils/utils'
import { useUpdateUser, useUser } from './useUserStore'

export function useEditProfile() {
  const user = useUser()
  const updateUser = useUpdateUser()

  const [name, setName] = useState(user.name)
  const [image, setImage] = useState(user.image ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isNameChanged = name.trim() !== '' && name !== user.name
  const isImageChanged = image.trim() !== (user.image ?? '')
  const isChanged = isNameChanged || isImageChanged

  async function save() {
    const trimmedName = name.trim()
    const trimmedImage = image.trim()
    setIsSaving(true)
    try {
      const updates: Record<string, string> = {}
      if (isNameChanged)
        updates.name = trimmedName
      if (isImageChanged)
        updates.image = trimmedImage || undefined as unknown as string

      await authClient.updateUser(updates)
      updateUser(updates)
      notifySuccess('Profile updated', 'Your profile has been updated.')
    }
    catch (error) {
      notifyError('Failed to update profile', error)
    }
    finally {
      setIsSaving(false)
    }
  }

  return { name, setName, image, setImage, isSaving, isChanged, save }
}
