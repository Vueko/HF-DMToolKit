import { app, BrowserWindow, Menu, shell, ipcMain, dialog, session, screen } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

// Allows UUIDs and simple slug IDs (e.g. "shared-map"), blocks path traversal
const SAFE_ID_RE = /^[a-zA-Z0-9_\-]{1,80}$/

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

function createPlayerWindow(): void {
    if (playerWin && !playerWin.isDestroyed()) {
        playerWin.focus()
        return
    }
    const displays = screen.getAllDisplays()
    const target = displays.length > 1 ? displays[1] : displays[0]
    const { x, y, width, height } = target.bounds
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
  ipcMain.on('store:set', (_, key: string, value: unknown) => store.set(key, value))
  ipcMain.on('store:delete', (_, key: string) => store.delete(key))

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
    if (!filePath.endsWith('.json')) return
    fs.writeFileSync(filePath, data, 'utf-8')
  })
  ipcMain.handle('fs:read-file', (_, filePath: string): string | null => {
    if (!filePath.endsWith('.json')) return null
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null
  })

  ipcMain.handle('dialog:save', (_, opts) => {
    if (!mainWindow) return { canceled: true }
    return dialog.showSaveDialog(mainWindow, opts)
  })
  ipcMain.handle('dialog:open', (_, opts) => {
    if (!mainWindow) return { canceled: true, filePaths: [] }
    return dialog.showOpenDialog(mainWindow, opts)
  })

  ipcMain.on('player:open', () => createPlayerWindow())
  ipcMain.on('player:close', () => {
    if (playerWin && !playerWin.isDestroyed()) playerWin.close()
  })
  ipcMain.on('player:set-map', (_, storedId: string) => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-map', storedId)
    }
  })
  ipcMain.on('player:clear-map', () => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:clear-map')
    }
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
  ipcMain.handle('player:is-open', () => playerWin !== null && !playerWin.isDestroyed())

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