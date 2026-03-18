import { ActionIcon, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

interface DeleteButtonProps {
  label?: string
  loading?: boolean
  onClick: () => void
}

export function DeleteButton({ label = 'Remove', loading, onClick }: DeleteButtonProps) {
  return (
    <Tooltip label={label}>
      <ActionIcon
        aria-label={label}
        variant="subtle"
        color="red"
        loading={loading}
        onClick={onClick}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Tooltip>
  )
}
