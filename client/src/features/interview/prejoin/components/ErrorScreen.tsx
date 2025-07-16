import { Button, Center, Stack, Text, Title } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { isHttpError } from '@/utils/HttpError'
import { jsonStringifyIndented } from '@/utils/utils'

interface ErrorScreenProps {
  error: Error
}

const isKnownStatus = (status?: number) => status === 401 || status === 404

function getFriendlyTitle(status?: number) {
  switch (status) {
    case 404:
      return 'Session not found'
    case 401:
      return 'Unauthorized'
    default:
      return 'Error starting session'
  }
}

export function ErrorScreen({ error }: ErrorScreenProps) {
  const isHttp = isHttpError(error)
  const status = isHttp ? error.status : undefined
  const message = error.message
  const details = isHttp ? error.details : null

  return (
    <Center mih="100vh">
      <Stack>
        <Title>{getFriendlyTitle(status)}</Title>
        {!isKnownStatus(status) && (
          <>
            {status && (
              <Text fw="bolder">
                {'Status: '}
                {status}
              </Text>
            )}
            <Text>
              {'Message: '}
              {message}
            </Text>
            {details && <pre>{jsonStringifyIndented(details)}</pre>}
          </>
        )}
        <Link to="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </Stack>
    </Center>
  )
}
