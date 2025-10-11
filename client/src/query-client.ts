import { QueryCache, QueryClient } from '@tanstack/react-query'
import { isHttpError } from './utils/HttpError'
import { showErrorNotification } from './utils/utils'

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

      showErrorNotification(errorTitle ?? 'Unexpected Query Error', message)
    },
  }),
})
