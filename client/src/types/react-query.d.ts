import '@tanstack/react-query'

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      errorTitle?: string
      errorMessage?: string
    }
    mutationMeta: Record<string, unknown>
  }
}
