import electron from 'electron'

// expose these methods to the renderer process
electron.contextBridge.exposeInMainWorld('electron', {
  // TODO add unsubscribe method
  subscribeToFeedback: callback => callback({ feedbackType: 'fixation' }),
  // eslint-disable-next-line no-console
  sendInterviewerCoordinates: coordinates => console.log(coordinates),
} satisfies Window['electron'])

// export function ipcInvoke<Key extends keyof EventPayloadMapping>(
//   key: Key,
// ): Promise<EventPayloadMapping[Key]> {
//   return electron.ipcRenderer.invoke(key)
// }

// export function ipcOn<Key extends keyof EventPayloadMapping>(
//   key: Key,
//   callback: (payload: EventPayloadMapping[Key]) => void,
// ) {
//   electron.ipcRenderer.on(key, (_, payload) => callback(payload))
// }
