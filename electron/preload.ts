import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

const PLAYER_CHANNELS = ['player:set-map', 'player:clear-map', 'player:show-overlay', 'player:clear-overlay', 'player:closed', 'player:set-fog', 'player:set-viewport', 'player:set-campaign-map', 'player:set-fear', 'player:set-rotation'] as const

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
        savePlayerImage: (id: string, data: ArrayBuffer): Promise<void> =>
            ipcRenderer.invoke('fs:save-player-image', id, new Uint8Array(data)),
        getPlayerImage: (id: string): Promise<Uint8Array | null> =>
            ipcRenderer.invoke('fs:get-player-image', id),
        deletePlayerImage: (id: string): Promise<void> =>
            ipcRenderer.invoke('fs:delete-player-image', id),
    },

    dialog: {
        save: (options: Electron.SaveDialogOptions) =>
            ipcRenderer.invoke('dialog:save', options),
        open: (options: Electron.OpenDialogOptions) =>
            ipcRenderer.invoke('dialog:open', options),
    },

    player: {
        open: (displayIndex?: number) => ipcRenderer.send('player:open', displayIndex),
        getDisplays: (): Promise<{ index: number; label: string; isPrimary: boolean }[]> =>
            ipcRenderer.invoke('player:get-displays'),
        close: () => ipcRenderer.send('player:close'),
        setMap: (storedId: string) => ipcRenderer.send('player:set-map', storedId),
        clearMap: () => ipcRenderer.send('player:clear-map'),
        showOverlay: (storedId: string, name: string) => ipcRenderer.send('player:show-overlay', storedId, name),
        clearOverlay: () => ipcRenderer.send('player:clear-overlay'),
        isOpen: (): Promise<boolean> => ipcRenderer.invoke('player:is-open'),
        captureMap: (rect: { x: number; y: number; width: number; height: number }): Promise<void> =>
            ipcRenderer.invoke('player:capture-map', rect),
        setCampaignMap: (storedId: string) => ipcRenderer.send('player:set-campaign-map', storedId),
        setFog: (zones: unknown[]) => ipcRenderer.send('player:set-fog', zones),
        setViewport: (viewport: { offsetX: number; offsetY: number; scale: number }) =>
            ipcRenderer.send('player:set-viewport', viewport),
        getWindowBounds: (): Promise<{ width: number; height: number } | null> =>
            ipcRenderer.invoke('player:get-window-bounds'),
        ready: () => ipcRenderer.send('player:ready'),
        setFear: (count: number) => ipcRenderer.send('player:set-fear', count),
        setRotation: (rotation: 0 | 90) => ipcRenderer.send('player:set-rotation', rotation),
    },

    vault: {
        pickFolder: (): Promise<string | null> => ipcRenderer.invoke('vault:pick-folder'),
        readTree: (root: string): Promise<unknown> => ipcRenderer.invoke('vault:read-tree', root),
        readFile: (rel: string): Promise<string | null> => ipcRenderer.invoke('vault:read-file', rel),
        readImage: (rel: string): Promise<Uint8Array | null> => ipcRenderer.invoke('vault:read-image', rel),
        search: (query: string): Promise<unknown> => ipcRenderer.invoke('vault:search', query),
    },

    on: (channel: string, cb: (...args: unknown[]) => void): (() => void) => {
        if (!(PLAYER_CHANNELS as readonly string[]).includes(channel)) return () => {}
        const handler = (_: IpcRendererEvent, ...args: unknown[]) => cb(...args)
        ipcRenderer.on(channel, handler)
        return () => ipcRenderer.off(channel, handler)
    },
})