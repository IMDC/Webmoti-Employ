import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { notifyError } from '@/utils/utils'
import { useUpdateUser, useUser } from './useUserStore'

export function useUpdateDisplayName() {
  const user = useUser()
  const updateUser = useUpdateUser()

  const [displayName, setDisplayName] = useState(user.name)
  const [isSaving, setIsSaving] = useState(false)

  const isChanged = displayName.trim() !== '' && displayName !== user.name

  async function save() {
    const trimmedName = displayName.trim()
    setIsSaving(true)
    try {
      await authClient.updateUser({ name: trimmedName })
      updateUser({ name: trimmedName })
      notifications.show({
        title: 'Display name updated',
        message: `Your display name has been changed to "${trimmedName}".`,
      })
    }
    catch (error) {
      notifyError('Failed to update display name', error)
    }
    finally {
      setIsSaving(false)
    }
  }

  return { displayName, setDisplayName, isSaving, isChanged, save }
}
