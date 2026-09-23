import { contextBridge, ipcRenderer } from 'electron'

type MenuAction = 'new' | 'open' | 'save' | 'save-as' | 'print' | 'export-pdf' | 'export-png'

const api = {
  platform: process.platform,
  file: {
    open: (): Promise<{ path: string; project: unknown } | null> =>
      ipcRenderer.invoke('file:open'),
    save: (
      path: string | null,
      project: unknown,
      title: string,
    ): Promise<{ path: string } | null> => ipcRenderer.invoke('file:save', path, project, title),
  },
  export: {
    pdf: (defaultName: string): Promise<string | null> =>
      ipcRenderer.invoke('export:pdf', defaultName),
    png: (defaultName: string, data: ArrayBuffer): Promise<string | null> =>
      ipcRenderer.invoke('export:png', defaultName, data),
  },
  print: (): Promise<void> => ipcRenderer.invoke('print:seat'),
  reveal: (filePath: string): Promise<void> => ipcRenderer.invoke('shell:reveal', filePath),
  onMenu: (cb: (action: MenuAction) => void): (() => void) => {
    const listener = (_e: unknown, action: MenuAction) => cb(action)
    ipcRenderer.on('menu:action', listener)
    return () => ipcRenderer.removeListener('menu:action', listener)
  },
}

contextBridge.exposeInMainWorld('seatmap', api)

export type SeatApiExposed = typeof api
