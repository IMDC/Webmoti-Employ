import { Center, Skeleton, Text } from '@mantine/core';
import { Interview } from './schema';

interface InterviewListProps {
  interviews: Array<Interview>;
}

export function InterviewList({ interviews }: InterviewListProps) {
  return (
    <>
      <Skeleton height={60} />
      <Skeleton height={60} />
      <Skeleton height={60} />

      {/* <Center>
        <Text fw="bolder">You have no scheduled interviews</Text>
      </Center> */}

      {/* <ScrollArea>
              {[...Array(20)].map((_, i) => (
                <Text key={i}>Item {i + 1}</Text>
              ))}
            </ScrollArea> */}
    </>
  );
}
