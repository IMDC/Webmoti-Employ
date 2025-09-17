import type { CommandChannel, VideoClient } from '@zoom/videosdk'
import { createStore } from 'zustand'

export interface CommandChannelStoreActions {
  //
  // TODO: put command store actions (functions) here
  // these functions should operate on the state in this store
  // see chat/createChatStore.ts for an example of this
  //
  cleanup: () => void
}

export interface CommandChannelStore {
  //
  // TODO: add state here
  //
  commandChannelClient: typeof CommandChannel
  actions: CommandChannelStoreActions
}

export function createCommandChannelStore(zoomClient: typeof VideoClient) {
  const commandChannelClient = zoomClient.getCommandClient()

  const commandChannelStore = createStore<CommandChannelStore>(() => ({
    commandChannelClient,
    //
    // TODO
    //
    actions: {
    //
    // TODO
    //
      cleanup: () => {
        //
        // TODO: cleanup any added listeners
        //
      },
    },
  }))

  //
  // TODO: handle messages here (add event listeners)
  //

  return commandChannelStore
}
