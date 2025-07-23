import electron from 'electron'

// expose these methods to the renderer process
electron.contextBridge.exposeInMainWorld('electron', {
  subscribeToFeedback: callback =>
    ipcOn('feedback', (feedback) => {
      callback(feedback)
    }),
  // eslint-disable-next-line no-console
  sendInterviewerCoordinates: coordinates => console.log(coordinates),
} satisfies Window['electron'])

// export function ipcInvoke<Key extends keyof EventPayloadMapping>(
//   key: Key,
// ): Promise<EventPayloadMapping[Key]> {
//   return electron.ipcRenderer.invoke(key)
// }

export function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
  electron.ipcRenderer.on(key, cb)
  return () => electron.ipcRenderer.off(key, cb)
}
