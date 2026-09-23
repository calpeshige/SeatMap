import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

let win: BrowserWindow | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#f3f4f6',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    void win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    void win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

function sendMenu(action: string): void {
  win?.webContents.send('menu:action', action)
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{ role: 'appMenu' as const }]
      : []),
    {
      label: 'ファイル',
      submenu: [
        { label: '新規', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new') },
        { label: '開く…', accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open') },
        { type: 'separator' },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
        { label: '別名で保存…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenu('save-as') },
        { type: 'separator' },
        { label: '印刷…', accelerator: 'CmdOrCtrl+P', click: () => sendMenu('print') },
        { label: 'PDFで書き出し…', click: () => sendMenu('export-pdf') },
        { label: 'PNGで書き出し…', click: () => sendMenu('export-png') },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function registerIpc(): void {
  ipcMain.handle('file:open', async () => {
    const options = {
      title: '座席表を開く',
      filters: [
        { name: 'SeatMap', extensions: ['seat'] },
        { name: 'JSON', extensions: ['json'] },
      ],
      properties: ['openFile' as const],
    }
    const res = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)
    if (res.canceled || !res.filePaths[0]) return null
    const filePath = res.filePaths[0]
    const raw = await fs.readFile(filePath, 'utf-8')
    return { path: filePath, project: JSON.parse(raw) as unknown }
  })

  ipcMain.handle(
    'file:save',
    async (_e, filePath: string | null, project: unknown, title: string) => {
      let target = filePath
      if (!target) {
        const options = {
          title: '名前を付けて保存',
          defaultPath: path.join(app.getPath('desktop'), `${title || 'seatmap'}.seat`),
          filters: [{ name: 'SeatMap', extensions: ['seat'] }],
        }
        const res = win
          ? await dialog.showSaveDialog(win, options)
          : await dialog.showSaveDialog(options)
        if (res.canceled || !res.filePath) return null
        target = res.filePath
      }
      await fs.writeFile(target, JSON.stringify(project, null, 2), 'utf-8')
      return { path: target }
    },
  )

  ipcMain.handle('export:pdf', async (_e, defaultName: string) => {
    if (!win) return null
    const options = {
      title: 'PDFで書き出し',
      defaultPath: path.join(app.getPath('desktop'), `${defaultName || 'seatmap'}.pdf`),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    }
    const res = await dialog.showSaveDialog(win, options)
    if (res.canceled || !res.filePath) return null
    const data = await win.webContents.printToPDF({
      landscape: true,
      printBackground: true,
      pageSize: 'A4',
    })
    await fs.writeFile(res.filePath, data)
    return res.filePath
  })

  ipcMain.handle('export:png', async (_e, defaultName: string, data: ArrayBuffer) => {
    const options = {
      title: 'PNGで書き出し',
      defaultPath: path.join(app.getPath('desktop'), `${defaultName || 'seatmap'}.png`),
      filters: [{ name: 'PNG', extensions: ['png'] }],
    }
    const res = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options)
    if (res.canceled || !res.filePath) return null
    await fs.writeFile(res.filePath, Buffer.from(data))
    return res.filePath
  })

  ipcMain.handle('print:seat', async () => {
    win?.webContents.print({ landscape: true, printBackground: true })
  })

  ipcMain.handle('shell:reveal', async (_e, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}

app.whenReady().then(() => {
  registerIpc()
  buildMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
