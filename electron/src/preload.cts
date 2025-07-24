/* eslint-disable ts/no-require-imports */
const electron = require('electron')

// expose these methods to the renderer process
electron.contextBridge.exposeInMainWorld('electron', {
  subscribeToFeedback: callback =>
    ipcOn('feedback', (feedback) => {
      callback(feedback)
    }),
  // eslint-disable-next-line no-console
  sendInterviewerCoordinates: coordinates => console.log(coordinates),
  getModelBuffer: () => ipcInvoke('getModelBuffer'),
} satisfies Window['electron'])

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key)
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
  electron.ipcRenderer.on(key, cb)
  return () => electron.ipcRenderer.off(key, cb)
}
