import { Modal, Text } from '@mantine/core';
import { useAppStore } from '@/stores/store';

export function SettingsMenu() {
  const isSettingsOpened = useAppStore((state) => state.isSettingsOpen);
  const setIsSettingsOpened = useAppStore((state) => state.setIsSettingsOpen);

  return (
    <Modal
      opened={isSettingsOpened}
      onClose={() => setIsSettingsOpened(false)}
      title="Settings"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Text>Menu</Text>
    </Modal>
  );
}
