import { useEffect } from 'react'
import { logger } from '@/utils/logger'
import { isElectron } from '@/utils/utils'

export function useElectronLogs() {
  useEffect(() => {
    if (!isElectron())
      return

    // tell electron that logs can now be sent
    window.electron.setRendererReady()

    const unsubscribe = window.electron.subscribeToLogs((msg) => {
      logger.log('[Electron]', msg)
    })

    return () => unsubscribe()
  }, [])
}
