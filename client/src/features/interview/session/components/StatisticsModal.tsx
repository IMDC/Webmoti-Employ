import type { AudioQosData, VideoQosData } from '@zoom/videosdk'
import type { ReactNode } from 'react'
import { Badge, Group, Modal, Table, Tabs, Text } from '@mantine/core'
import { useMemo } from 'react'
import {
  useAudioDecodingStatistic,
  useAudioEncodingStatistic,
  useSystemResourceUsage,
  useVideoDecodingStatistic,
  useVideoEncodingStatistic,
} from '../../zoom/useZoomSessionStore'

interface MetricDef {
  title: string
  value: string | string[]
  format?: (value: unknown) => ReactNode
}

const AudioMetrics: MetricDef[] = [
  { title: 'Frequency', value: 'sample_rate', format: value => `${value ?? 'N/A'} khz` },
  { title: 'Bitrate', value: 'bitrate', format: value => typeof value === 'number' ? `${(value / 1024).toFixed(1)} kb/s` : 'N/A' },
  { title: 'Latency', value: 'rtt', format: value => `${value ?? 'N/A'} ms` },
  { title: 'Jitter', value: 'jitter', format: value => `${value ?? 'N/A'} ms` },
  { title: 'Packet Loss', value: 'avg_loss', format: value => `${value ?? 'N/A'}%` },
]

const VideoMetrics: MetricDef[] = [
  {
    title: 'Resolution',
    value: ['width', 'height'],
    format: value => Array.isArray(value) ? `${value[0] ?? 'N/A'}×${value[1] ?? 'N/A'}` : 'N/A',
  },
  { title: 'Frame Rate', value: 'fps', format: value => `${value ?? 'N/A'} fps` },
  { title: 'Bitrate', value: 'bitrate', format: value => typeof value === 'number' ? `${(value / 1024).toFixed(1)} kb/s` : 'N/A' },
  { title: 'Latency', value: 'rtt', format: value => `${value ?? 'N/A'} ms` },
  { title: 'Packet Loss', value: 'avg_loss', format: value => `${value ?? 'N/A'}%` },
]

function getCPUStatusInfo(pressureLevel?: number) {
  switch (pressureLevel) {
    case 0:
      return { color: 'green', text: 'Low' }
    case 1:
      return { color: 'yellow', text: 'Medium' }
    case 2:
      return { color: 'orange', text: 'High' }
    case 3:
      return { color: 'red', text: 'Critical' }
    default:
      return { color: 'gray', text: 'Unknown' }
  }
}

type StatisticsRowSource = AudioQosData | VideoQosData

function getMetricValue(source: StatisticsRowSource | null, value: string | string[]) {
  if (!source)
    return null

  const sourceRecord = source as unknown as Record<string, unknown>

  if (Array.isArray(value)) {
    return value.map(key => sourceRecord[key])
  }
  return sourceRecord[value]
}

function buildRows(metrics: MetricDef[], encode: StatisticsRowSource | null, decode: StatisticsRowSource | null) {
  return metrics.map((metric) => {
    const encodeValue = getMetricValue(encode, metric.value)
    const decodeValue = getMetricValue(decode, metric.value)

    return {
      metric: metric.title,
      encode: metric.format ? metric.format(encodeValue) : String(encodeValue ?? 'N/A'),
      decode: metric.format ? metric.format(decodeValue) : String(decodeValue ?? 'N/A'),
    }
  })
}

interface StatisticsModalProps {
  opened: boolean
  onClose: () => void
}

export function StatisticsModal({ opened, onClose }: StatisticsModalProps) {
  const audioEncodingStatistic = useAudioEncodingStatistic()
  const audioDecodingStatistic = useAudioDecodingStatistic()
  const videoEncodingStatistic = useVideoEncodingStatistic()
  const videoDecodingStatistic = useVideoDecodingStatistic()
  const systemResourceUsage = useSystemResourceUsage()

  const audioRows = useMemo(
    () => buildRows(AudioMetrics, audioEncodingStatistic, audioDecodingStatistic),
    [audioEncodingStatistic, audioDecodingStatistic],
  )

  const videoRows = useMemo(
    () => buildRows(VideoMetrics, videoEncodingStatistic, videoDecodingStatistic),
    [videoEncodingStatistic, videoDecodingStatistic],
  )

  const cpuPressure = systemResourceUsage?.cpu_usage?.system_cpu_pressure_level
  const cpuStatus = getCPUStatusInfo(cpuPressure)

  return (
    <Modal opened={opened} onClose={onClose} title="Audio / Video / System Statistics" size="xl" centered>
      <Tabs defaultValue="audio">
        <Tabs.List>
          <Tabs.Tab value="audio">Audio</Tabs.Tab>
          <Tabs.Tab value="video">Video</Tabs.Tab>
          <Tabs.Tab value="system">System</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="audio" pt="md">
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th>Encode</Table.Th>
                <Table.Th>Decode</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {audioRows.map(row => (
                <Table.Tr key={row.metric}>
                  <Table.Td>{row.metric}</Table.Td>
                  <Table.Td>{row.encode}</Table.Td>
                  <Table.Td>{row.decode}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="video" pt="md">
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th>Encode</Table.Th>
                <Table.Th>Decode</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {videoRows.map(row => (
                <Table.Tr key={row.metric}>
                  <Table.Td>{row.metric}</Table.Td>
                  <Table.Td>{row.encode}</Table.Td>
                  <Table.Td>{row.decode}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="system" pt="md">
          <Group mb="sm">
            <Text fw={500}>CPU Pressure</Text>
            <Badge color={cpuStatus.color}>{cpuStatus.text}</Badge>
          </Group>
          <Text size="sm">
            System CPU Pressure Level:
            {' '}
            {cpuPressure ?? 'N/A'}
          </Text>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
