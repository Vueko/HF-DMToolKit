import { app, BrowserWindow, Menu, shell, ipcMain, dialog, session } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  mainWindow.on('closed', () => { mainWindow = null })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
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
  ensureDir(audioDir)
  ensureDir(mapsDir)

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
    if (!UUID_RE.test(id)) return
    fs.writeFileSync(join(audioDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-audio', (_, id: string): Uint8Array | null => {
    if (!UUID_RE.test(id)) return null
    const p = join(audioDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-audio', (_, id: string) => {
    if (!UUID_RE.test(id)) return
    const p = join(audioDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  ipcMain.handle('fs:save-map-image', (_, id: string, data: Uint8Array) => {
    if (!UUID_RE.test(id)) return
    fs.writeFileSync(join(mapsDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-map-image', (_, id: string): Uint8Array | null => {
    if (!UUID_RE.test(id)) return null
    const p = join(mapsDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-map-image', (_, id: string) => {
    if (!UUID_RE.test(id)) return
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

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})