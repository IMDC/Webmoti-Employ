import { Modal } from '@mantine/core'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="About"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      hi
    </Modal>
  )
}
