import electron from 'electron'

// expose these methods to the renderer process
electron.contextBridge.exposeInMainWorld('electron', {
  subscribeToFeedback: (callback: (feedback: any) => void) => callback({}),
  // eslint-disable-next-line no-console
  sendInterviewerCoordinates: (coordinates: any) => console.log(coordinates),
})
