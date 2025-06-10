import {
  IconChevronUp,
  IconMenu2,
  IconMicrophone,
  IconPhoneOff,
  IconVideo,
} from '@tabler/icons-react';
import { Button, Flex } from '@mantine/core';

export function MenuBar() {
  return (
    <Flex justify="center" align="center" h="100%" gap="md">
      <Button.Group>
        <Button variant="default">
          <IconChevronUp stroke={1.5} size={16} />
        </Button>

        <Button variant="default">
          <IconMicrophone stroke={1.5} size={16} />
        </Button>
      </Button.Group>

      <Button.Group>
        <Button variant="default">
          <IconChevronUp stroke={1.5} size={16} />
        </Button>
        <Button variant="default">
          <IconVideo stroke={1.5} size={16} />
        </Button>
      </Button.Group>

      <Button variant="default">
        <IconMenu2 stroke={1.5} size={16} />
      </Button>

      <Button color="red">
        <IconPhoneOff stroke={1.5} size={16} />
      </Button>
    </Flex>
  );
}
