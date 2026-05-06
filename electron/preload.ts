import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
    onMaximize: (cb: (v: boolean) => void) => {
      const handler = (_: IpcRendererEvent, value: boolean) => cb(value)
      ipcRenderer.on('window:maximized', handler)
      return () => ipcRenderer.off('window:maximized', handler)
    },
  },

  store: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown): void => ipcRenderer.send('store:set', key, value),
    delete: (key: string): void => ipcRenderer.send('store:delete', key),
  },

  fs: {
    saveAudio: (id: string, data: ArrayBuffer): Promise<void> =>
      ipcRenderer.invoke('fs:save-audio', id, new Uint8Array(data)),
    getAudio: (id: string): Promise<Uint8Array | null> =>
      ipcRenderer.invoke('fs:get-audio', id),
    deleteAudio: (id: string): Promise<void> =>
      ipcRenderer.invoke('fs:delete-audio', id),
    saveMapImage: (id: string, data: ArrayBuffer): Promise<void> =>
      ipcRenderer.invoke('fs:save-map-image', id, new Uint8Array(data)),
    getMapImage: (id: string): Promise<Uint8Array | null> =>
      ipcRenderer.invoke('fs:get-map-image', id),
    deleteMapImage: (id: string): Promise<void> =>
      ipcRenderer.invoke('fs:delete-map-image', id),
    writeFile: (filePath: string, data: string): Promise<void> =>
      ipcRenderer.invoke('fs:write-file', filePath, data),
    readFile: (filePath: string): Promise<string | null> =>
      ipcRenderer.invoke('fs:read-file', filePath),
  },

  dialog: {
    save: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke('dialog:save', options),
    open: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:open', options),
  },
})