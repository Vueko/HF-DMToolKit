import { app, BrowserWindow, Menu, shell, ipcMain, dialog, session, screen } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

// Allows UUIDs and simple slug IDs (e.g. "shared-map"), blocks path traversal
const SAFE_ID_RE = /^[a-zA-Z0-9_\-]{1,80}$/

const STORE_KEYS = new Set(['dh-fear', 'dh-campaigns', 'dh-cards', 'dh-music', 'dh-soundboard', 'dh-settings'])

class DataStore {
  private readonly filePath: string
  private cache: Record<string, unknown> = {}
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.filePath = join(app.getPath('userData'), 'store.json')
    this.load()
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      }
    } catch { }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => this.flush(), 150)
  }

  private flush(): void {
    const tmp = `${this.filePath}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(this.cache))
    fs.renameSync(tmp, this.filePath)
  }

  get(key: string): unknown { return this.cache[key] ?? null }
  set(key: string, value: unknown): void { this.cache[key] = value; this.scheduleFlush() }
  delete(key: string): void { delete this.cache[key]; this.scheduleFlush() }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

let mainWindow: BrowserWindow | null = null
let playerWin: BrowserWindow | null = null

// Pending state to replay when player window signals it's ready
let pendingMapId: string | null = null
let pendingFog: unknown[] | null = null
let pendingViewport: { offsetX: number; offsetY: number; scale: number } | null = null
let pendingFear: number = 0

function setPendingFear(count: number): boolean {
  if (!Number.isInteger(count) || count < 0 || count > 12) return false
  pendingFear = count
  return true
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized', true))
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false))
  mainWindow.on('closed', () => {
    mainWindow = null
    if (playerWin && !playerWin.isDestroyed()) playerWin.close()
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const { protocol } = new URL(details.url)
      if (protocol === 'https:' || protocol === 'http:') shell.openExternal(details.url)
    } catch { }
    return { action: 'deny' }
  })
}

function createPlayerWindow(displayIndex?: number): void {
    if (playerWin && !playerWin.isDestroyed()) {
        playerWin.focus()
        return
    }
    const displays = screen.getAllDisplays()
    const idx = displayIndex !== undefined
        ? Math.min(Math.max(0, displayIndex), displays.length - 1)
        : displays.length > 1 ? 1 : 0
    const { x, y, width, height } = displays[idx].bounds
    playerWin = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    })
    playerWin.on('closed', () => {
        playerWin = null
        mainWindow?.webContents.send('player:closed')
    })
    if (!app.isPackaged) {
        playerWin.loadURL('http://localhost:5173/#/player-screen')
    } else {
        playerWin.loadFile(join(__dirname, '../dist/index.html'), { hash: '/player-screen' })
    }
    playerWin.once('ready-to-show', () => playerWin?.show())

    // After the page finishes loading, wait for React effects to register their
    // ipcRenderer listeners (effects run async after paint), then replay pending state.
    playerWin.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            if (!playerWin || playerWin.isDestroyed()) return
            if (pendingMapId) playerWin.webContents.send('player:set-map', pendingMapId)
            if (pendingFog) playerWin.webContents.send('player:set-fog', pendingFog)
            if (pendingViewport) playerWin.webContents.send('player:set-viewport', pendingViewport)
            playerWin.webContents.send('player:set-fear', pendingFear)
        }, 300)
    })
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self';"
          ],
        },
      })
    })
  }

  Menu.setApplicationMenu(null)

  const store = new DataStore()
  const audioDir = join(app.getPath('userData'), 'audio')
  const mapsDir = join(app.getPath('userData'), 'maps')
  const playerScreenDir = join(app.getPath('userData'), 'player-screen')
  ensureDir(audioDir)
  ensureDir(mapsDir)
  ensureDir(playerScreenDir)

  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)

  ipcMain.handle('store:get', (_, key: string) => store.get(key))
  ipcMain.on('store:set', (_, key: string, value: unknown) => { if (STORE_KEYS.has(key)) store.set(key, value) })
  ipcMain.on('store:delete', (_, key: string) => { if (STORE_KEYS.has(key)) store.delete(key) })

  ipcMain.handle('fs:save-audio', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(audioDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-audio', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(audioDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-audio', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(audioDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  ipcMain.handle('fs:save-map-image', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(mapsDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-map-image', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(mapsDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-map-image', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(mapsDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  ipcMain.handle('fs:write-file', (_, filePath: string, data: string) => {
    const resolved = join(filePath)
    if (!resolved.endsWith('.json')) return
    fs.writeFileSync(resolved, data, 'utf-8')
  })
  ipcMain.handle('fs:read-file', (_, filePath: string): string | null => {
    const resolved = join(filePath)
    if (!resolved.endsWith('.json')) return null
    return fs.existsSync(resolved) ? fs.readFileSync(resolved, 'utf-8') : null
  })

  ipcMain.handle('dialog:save', (_, opts) => {
    if (!mainWindow) return { canceled: true }
    return dialog.showSaveDialog(mainWindow, opts)
  })
  ipcMain.handle('dialog:open', (_, opts) => {
    if (!mainWindow) return { canceled: true, filePaths: [] }
    return dialog.showOpenDialog(mainWindow, opts)
  })

  ipcMain.handle('player:get-displays', () =>
    screen.getAllDisplays().map((d, i) => ({
      index: i,
      label: `Display ${i + 1}  ${d.bounds.width}×${d.bounds.height}`,
      isPrimary: d.id === screen.getPrimaryDisplay().id,
    }))
  )
  ipcMain.on('player:open', (_, displayIndex?: number) => createPlayerWindow(displayIndex))
  ipcMain.on('player:close', () => {
    if (playerWin && !playerWin.isDestroyed()) playerWin.close()
  })
  ipcMain.on('player:set-map', (_, storedId: string) => {
    pendingMapId = storedId
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-map', storedId)
    }
  })
  ipcMain.on('player:clear-map', () => {
    pendingMapId = null
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:clear-map')
    }
  })
  ipcMain.on('player:ready', () => {
    if (!playerWin || playerWin.isDestroyed()) return
    if (pendingMapId) playerWin.webContents.send('player:set-map', pendingMapId)
    if (pendingFog) playerWin.webContents.send('player:set-fog', pendingFog)
    if (pendingViewport) playerWin.webContents.send('player:set-viewport', pendingViewport)
    playerWin.webContents.send('player:set-fear', pendingFear)
  })
  ipcMain.on('player:show-overlay', (_, storedId: string, name: string) => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:show-overlay', storedId, name)
    }
  })
  ipcMain.on('player:clear-overlay', () => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:clear-overlay')
    }
  })
  ipcMain.on('player:set-campaign-map', (_, storedId: string) => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-campaign-map', storedId)
    }
  })
  ipcMain.on('player:set-fog', (_, zones: unknown) => {
    if (!Array.isArray(zones)) return
    pendingFog = zones
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-fog', zones)
    }
  })
  ipcMain.on('player:set-viewport', (_, viewport: { offsetX: number; offsetY: number; scale: number }) => {
    pendingViewport = viewport
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-viewport', viewport)
    }
  })
  ipcMain.on('player:set-fear', (_, count: number) => {
    if (!setPendingFear(count)) return
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-fear', pendingFear)
    }
  })
  ipcMain.handle('player:is-open', () => playerWin !== null && !playerWin.isDestroyed())
  ipcMain.handle('player:get-window-bounds', () => {
    if (!playerWin || playerWin.isDestroyed()) return null
    const { width, height } = playerWin.getBounds()
    return { width, height }
  })

  ipcMain.handle('player:capture-map', async (_, rect: { x: number; y: number; width: number; height: number }) => {
    if (!mainWindow || mainWindow.isDestroyed() || !playerWin || playerWin.isDestroyed()) return
    const image = await mainWindow.webContents.capturePage(rect)
    fs.writeFileSync(join(playerScreenDir, 'campaign-map-snapshot'), image.toPNG())
    playerWin.webContents.send('player:show-overlay', 'campaign-map-snapshot', 'Campaign Map')
  })

  ipcMain.handle('fs:save-player-image', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(playerScreenDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-player-image', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(playerScreenDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-player-image', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(playerScreenDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})