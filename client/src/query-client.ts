import { notifications } from '@mantine/notifications'
import { QueryCache, QueryClient } from '@tanstack/react-query'
import { isHttpError } from './utils/HttpError'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const errorTitle = query.meta?.errorTitle
      const errorMessage = query.meta?.errorMessage
      if (!errorTitle && !errorMessage)
        return

      const message
        = errorMessage
          ?? (isHttpError(error)
            ? error.message
            : 'Something went wrong. Please try again.')

      notifications.show({
        title: errorTitle,
        message,
        color: 'red',
        autoClose: false,
      })
    },
  }),
})
