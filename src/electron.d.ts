export {}

declare global {
    interface Window {
        electron: {
            platform: string
            window: {
                minimize: () => void
                maximize: () => void
                close: () => void
                isMaximized: () => Promise<boolean>
                onMaximize: (callback: (isMaximized: boolean) => void) => () => void
            }
            store: {
                get: (key: string) => Promise<unknown>
                set: (key: string, value: unknown) => void
                delete: (key: string) => void
            }
            fs: {
                saveAudio: (id: string, data: ArrayBuffer) => Promise<void>
                getAudio: (id: string) => Promise<Uint8Array | null>
                deleteAudio: (id: string) => Promise<void>
                saveMapImage: (id: string, data: ArrayBuffer) => Promise<void>
                getMapImage: (id: string) => Promise<Uint8Array | null>
                deleteMapImage: (id: string) => Promise<void>
                writeFile: (filePath: string, data: string) => Promise<void>
                readFile: (filePath: string) => Promise<string | null>
                savePlayerImage: (id: string, data: ArrayBuffer) => Promise<void>
                getPlayerImage: (id: string) => Promise<Uint8Array | null>
                deletePlayerImage: (id: string) => Promise<void>
            }
            dialog: {
                save: (options: {
                    defaultPath?: string
                    filters?: { name: string; extensions: string[] }[]
                }) => Promise<{ canceled: boolean; filePath?: string }>
                open: (options: {
                    filters?: { name: string; extensions: string[] }[]
                    properties?: string[]
                }) => Promise<{ canceled: boolean; filePaths: string[] }>
            }
            player: {
                open: () => void
                close: () => void
                setMap: (storedId: string) => void
                clearMap: () => void
                showOverlay: (storedId: string, name: string) => void
                clearOverlay: () => void
                isOpen: () => Promise<boolean>
                captureMap: (rect: { x: number; y: number; width: number; height: number }) => Promise<void>
            }
            on: (channel: 'player:set-map' | 'player:clear-map' | 'player:show-overlay' | 'player:clear-overlay' | 'player:closed', cb: (...args: unknown[]) => void) => () => void
        }
    }
}