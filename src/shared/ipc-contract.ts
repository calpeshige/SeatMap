import type { SeatProject } from './types'

export const IPC = {
  fileOpen: 'file:open',
  fileSave: 'file:save',
  exportPDF: 'export:pdf',
  exportPNG: 'export:png',
  print: 'print:seat',
  reveal: 'shell:reveal',
  menu: 'menu:action', // main -> renderer（メニュー/ショートカット通知）
} as const

/** main -> renderer に飛ぶメニューアクション種別 */
export type MenuAction = 'new' | 'open' | 'save' | 'save-as' | 'print' | 'export-pdf' | 'export-png'

export interface SeatApi {
  platform: NodeJS.Platform
  file: {
    open: () => Promise<{ path: string; project: unknown } | null>
    save: (path: string | null, project: SeatProject, title: string) => Promise<{ path: string } | null>
  }
  export: {
    pdf: (defaultName: string) => Promise<string | null>
    png: (defaultName: string, data: ArrayBuffer) => Promise<string | null>
  }
  print: () => Promise<void>
  reveal: (path: string) => Promise<void>
  onMenu: (cb: (action: MenuAction) => void) => () => void
}
