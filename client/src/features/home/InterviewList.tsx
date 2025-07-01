import { Center, Text } from '@mantine/core';

export function InterviewList() {
  return (
    <>
      {/* <Skeleton height="100%" /> */}

      <Center>
        <Text fw="bolder">You have no scheduled interviews</Text>
      </Center>

      {/* <ScrollArea>
              {[...Array(20)].map((_, i) => (
                <Text key={i}>Item {i + 1}</Text>
              ))}
            </ScrollArea> */}
    </>
  );
}
