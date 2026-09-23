import { create } from 'zustand'
import type {
  CellContent,
  FacilityKind,
  Person,
  Rank,
  SeatProject,
} from '@shared/types'
import {
  cellIndex,
  colSpanOf,
  deleteCol,
  deleteRow,
  getCell,
  insertCol,
  insertRow,
  resizeGrid,
  rowSpanOf,
  setColAisle,
  setRowAisle,
} from '@renderer/lib/grid'
import { DEFAULT_CELL_H, DEFAULT_CELL_W } from '@shared/types'
import { seatTemplateSchema } from '@shared/schema'
import { uid } from '@renderer/lib/id'
import { createSampleProject } from '@renderer/lib/project'

export interface CellPos {
  row: number
  col: number
}

/** 配置ツールで塗る対象。'aisle'=通路 / FacilityKind=設備 / null=なし */
export type PaintTool = 'aisle' | FacilityKind | null

interface SeatState {
  project: SeatProject
  filePath: string | null
  dirty: boolean
  selectedCell: CellPos | null
  selectedPersonId: string | null

  // グリッド
  setGridSize: (rows: number, cols: number) => void
  insertRowAt: (at: number) => void
  deleteRowAt: (at: number) => void
  insertColAt: (at: number) => void
  deleteColAt: (at: number) => void
  setColWidth: (col: number, w: number) => void
  setRowHeight: (row: number, h: number) => void

  // 通路 / 結合
  setAisle: (row: number, col: number, on: boolean) => void
  setColAisle: (col: number, on: boolean) => void
  setRowAisle: (row: number, on: boolean) => void
  mergeCell: (pos: CellPos, dir: 'right' | 'down' | 'left' | 'up') => void
  unmergeCell: (pos: CellPos) => void

  // セル移動/スワップ（最重要）
  swapCells: (from: CellPos, to: CellPos) => void
  clearCell: (row: number, col: number) => void
  placeContent: (row: number, col: number, content: CellContent) => void

  // 人 CRUD
  addPerson: (name: string, rankId?: string | null) => string
  updatePerson: (id: string, patch: Partial<Pick<Person, 'name' | 'rankId' | 'note'>>) => void
  removePerson: (id: string) => void

  // 設備
  addFacility: (kind: FacilityKind, label?: string) => string
  updateFacility: (id: string, patch: Partial<{ kind: FacilityKind; label: string }>) => void
  removeFacility: (id: string) => void

  // 階級 CRUD
  addRank: (name: string, color: string) => string
  updateRank: (id: string, patch: Partial<Pick<Rank, 'name' | 'color' | 'order'>>) => void
  removeRank: (id: string) => void

  // 選択
  selectCell: (pos: CellPos | null) => void
  selectPerson: (personId: string) => void

  // 表示ズーム（永続化しないUI状態）
  zoom: number
  setZoom: (z: number) => void

  // 配置ツール（UI状態）: 'aisle'=通路 / FacilityKind=設備スタンプ / null=なし
  paintTool: PaintTool
  setPaintTool: (t: PaintTool) => void

  // ファイル入出力
  newProject: () => void
  loadProject: (path: string, project: SeatProject) => void
  markSaved: (path: string) => void

  // デフォルトレイアウト（テンプレート。人は含まない）
  saveAsDefault: () => void
  hasDefault: () => boolean
  applyDefault: () => boolean
}

const DEFAULT_TEMPLATE_KEY = 'seatmap:defaultTemplate'

export const useSeatStore = create<SeatState>((set, get) => {
  /** 変更系の共通ラッパ: project を更新しつつ dirty と updatedAt を立てる */
  const mutate = (fn: (p: SeatProject) => SeatProject): void => {
    set((s) => {
      const next = fn(s.project)
      next.meta = { ...next.meta, updatedAt: new Date().toISOString() }
      return { project: next, dirty: true }
    })
  }

  return {
    project: createSampleProject(),
    filePath: null,
    dirty: false,
    selectedCell: null,
    selectedPersonId: null,
    zoom: 1,
    paintTool: null,

    setGridSize: (rows, cols) =>
      mutate((p) => ({ ...p, grid: resizeGrid(p.grid, rows, cols) })),

    insertRowAt: (at) => mutate((p) => ({ ...p, grid: insertRow(p.grid, at) })),
    deleteRowAt: (at) => mutate((p) => ({ ...p, grid: deleteRow(p.grid, at) })),
    insertColAt: (at) => mutate((p) => ({ ...p, grid: insertCol(p.grid, at) })),
    deleteColAt: (at) => mutate((p) => ({ ...p, grid: deleteCol(p.grid, at) })),

    setColWidth: (col, w) =>
      mutate((p) => {
        const arr = (p.grid.colWidths ?? Array(p.grid.cols).fill(DEFAULT_CELL_W)).slice()
        arr[col] = Math.max(24, w)
        return { ...p, grid: { ...p.grid, colWidths: arr } }
      }),

    setRowHeight: (row, h) =>
      mutate((p) => {
        const arr = (p.grid.rowHeights ?? Array(p.grid.rows).fill(DEFAULT_CELL_H)).slice()
        arr[row] = Math.max(20, h)
        return { ...p, grid: { ...p.grid, rowHeights: arr } }
      }),

    setAisle: (row, col, on) =>
      mutate((p) => {
        const i = cellIndex(p.grid.cols, row, col)
        const cells = p.grid.cells.slice()
        cells[i] = { ...cells[i], content: { type: on ? 'aisle' : 'empty' } }
        return { ...p, grid: { ...p.grid, cells } }
      }),

    setColAisle: (col, on) => mutate((p) => ({ ...p, grid: setColAisle(p.grid, col, on) })),
    setRowAisle: (row, on) => mutate((p) => ({ ...p, grid: setRowAisle(p.grid, row, on) })),

    mergeCell: (pos, dir) =>
      mutate((p) => {
        // 左/上は「左上のセルをマスターにして 右/下 結合」に読み替える
        let masterPos = pos
        const realDir: 'right' | 'down' = dir === 'down' || dir === 'up' ? 'down' : 'right'
        if (dir === 'left') {
          if (pos.col === 0) return p
          let mc = pos.col - 1
          while (mc >= 0 && getCell(p.grid, pos.row, mc)?.hidden) mc--
          if (mc < 0) return p
          masterPos = { row: pos.row, col: mc }
        } else if (dir === 'up') {
          if (pos.row === 0) return p
          let mr = pos.row - 1
          while (mr >= 0 && getCell(p.grid, mr, pos.col)?.hidden) mr--
          if (mr < 0) return p
          masterPos = { row: mr, col: pos.col }
        }

        const master = getCell(p.grid, masterPos.row, masterPos.col)
        if (!master || master.hidden) return p
        pos = masterPos
        const cs = colSpanOf(master)
        const rs = rowSpanOf(master)
        const cells = p.grid.cells.slice()

        if (realDir === 'right') {
          const targetCol = pos.col + cs
          if (targetCol >= p.grid.cols) return p
          // 吸収する列（master の高さ分）が単純セルであることを確認
          for (let dr = 0; dr < rs; dr++) {
            const t = getCell(p.grid, pos.row + dr, targetCol)
            if (!t || t.hidden || colSpanOf(t) > 1 || rowSpanOf(t) > 1) return p
          }
          for (let dr = 0; dr < rs; dr++) {
            const ti = cellIndex(p.grid.cols, pos.row + dr, targetCol)
            cells[ti] = { ...cells[ti], content: { type: 'empty' }, hidden: true }
          }
          cells[cellIndex(p.grid.cols, pos.row, pos.col)] = { ...master, colSpan: cs + 1 }
        } else {
          const targetRow = pos.row + rs
          if (targetRow >= p.grid.rows) return p
          for (let dc = 0; dc < cs; dc++) {
            const t = getCell(p.grid, targetRow, pos.col + dc)
            if (!t || t.hidden || colSpanOf(t) > 1 || rowSpanOf(t) > 1) return p
          }
          for (let dc = 0; dc < cs; dc++) {
            const ti = cellIndex(p.grid.cols, targetRow, pos.col + dc)
            cells[ti] = { ...cells[ti], content: { type: 'empty' }, hidden: true }
          }
          cells[cellIndex(p.grid.cols, pos.row, pos.col)] = { ...master, rowSpan: rs + 1 }
        }
        return { ...p, grid: { ...p.grid, cells } }
      }),

    unmergeCell: (pos) =>
      mutate((p) => {
        const master = getCell(p.grid, pos.row, pos.col)
        if (!master) return p
        const cs = colSpanOf(master)
        const rs = rowSpanOf(master)
        if (cs === 1 && rs === 1) return p
        const cells = p.grid.cells.slice()
        for (let dr = 0; dr < rs; dr++) {
          for (let dc = 0; dc < cs; dc++) {
            const ci = cellIndex(p.grid.cols, pos.row + dr, pos.col + dc)
            if (dr === 0 && dc === 0) {
              cells[ci] = { ...master, colSpan: 1, rowSpan: 1 }
            } else {
              cells[ci] = { row: pos.row + dr, col: pos.col + dc, content: { type: 'empty' } }
            }
          }
        }
        return { ...p, grid: { ...p.grid, cells } }
      }),

    swapCells: (from, to) => {
      if (from.row === to.row && from.col === to.col) return
      mutate((p) => {
        const cols = p.grid.cols
        const fi = cellIndex(cols, from.row, from.col)
        const ti = cellIndex(cols, to.row, to.col)
        const cells = p.grid.cells.slice()
        const a = cells[fi]
        const b = cells[ti]
        if (!a || !b) return p
        cells[fi] = { ...a, content: b.content }
        cells[ti] = { ...b, content: a.content }
        return { ...p, grid: { ...p.grid, cells } }
      })
    },

    clearCell: (row, col) =>
      mutate((p) => {
        const i = cellIndex(p.grid.cols, row, col)
        const cells = p.grid.cells.slice()
        cells[i] = { ...cells[i], content: { type: 'empty' } }
        return { ...p, grid: { ...p.grid, cells } }
      }),

    placeContent: (row, col, content) =>
      mutate((p) => {
        const i = cellIndex(p.grid.cols, row, col)
        const cells = p.grid.cells.slice()
        cells[i] = { ...cells[i], content }
        return { ...p, grid: { ...p.grid, cells } }
      }),

    addPerson: (name, rankId = null) => {
      const id = uid('person:')
      mutate((p) => ({
        ...p,
        people: [...p.people, { id, name, rankId }],
      }))
      return id
    },

    updatePerson: (id, patch) =>
      mutate((p) => ({
        ...p,
        people: p.people.map((per) => (per.id === id ? { ...per, ...patch } : per)),
      })),

    removePerson: (id) => {
      mutate((p) => ({
        ...p,
        people: p.people.filter((per) => per.id !== id),
        grid: {
          ...p.grid,
          cells: p.grid.cells.map((c) =>
            c.content.type === 'person' && c.content.personId === id
              ? { ...c, content: { type: 'empty' } }
              : c,
          ),
        },
      }))
      if (get().selectedPersonId === id) set({ selectedPersonId: null })
    },

    addFacility: (kind, label) => {
      const id = uid('fac:')
      mutate((p) => ({ ...p, facilities: [...p.facilities, { id, kind, label }] }))
      return id
    },

    updateFacility: (id, patch) =>
      mutate((p) => ({
        ...p,
        facilities: p.facilities.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),

    removeFacility: (id) =>
      mutate((p) => ({
        ...p,
        facilities: p.facilities.filter((f) => f.id !== id),
        grid: {
          ...p.grid,
          cells: p.grid.cells.map((c) =>
            c.content.type === 'facility' && c.content.facilityId === id
              ? { ...c, content: { type: 'empty' } }
              : c,
          ),
        },
      })),

    addRank: (name, color) => {
      const id = uid('rank:')
      mutate((p) => ({
        ...p,
        ranks: [...p.ranks, { id, name, color, order: p.ranks.length }],
      }))
      return id
    },

    updateRank: (id, patch) =>
      mutate((p) => ({
        ...p,
        ranks: p.ranks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      })),

    removeRank: (id) =>
      mutate((p) => ({
        ...p,
        ranks: p.ranks.filter((r) => r.id !== id),
        people: p.people.map((per) => (per.rankId === id ? { ...per, rankId: null } : per)),
      })),

    selectCell: (pos) => {
      if (!pos) {
        set({ selectedCell: null, selectedPersonId: null })
        return
      }
      const cell = getCell(get().project.grid, pos.row, pos.col)
      const personId = cell?.content.type === 'person' ? cell.content.personId : null
      set({ selectedCell: pos, selectedPersonId: personId })
    },

    selectPerson: (personId) => set({ selectedPersonId: personId, selectedCell: null }),

    setZoom: (z) => set({ zoom: Math.max(0.4, Math.min(2, z)) }),

    setPaintTool: (t) => set({ paintTool: t }),

    newProject: () =>
      set({
        project: createSampleProject(),
        filePath: null,
        dirty: false,
        selectedCell: null,
        selectedPersonId: null,
      }),

    loadProject: (path, project) =>
      set({
        project,
        filePath: path,
        dirty: false,
        selectedCell: null,
        selectedPersonId: null,
      }),

    markSaved: (path) => set({ filePath: path, dirty: false }),

    saveAsDefault: () => {
      const p = get().project
      // 人はテンプレートに含めない（配置セルは空マスに、設備・通路・結合・幅は保持）
      const cells = p.grid.cells.map((c) =>
        c.content.type === 'person' ? { ...c, content: { type: 'empty' as const } } : c,
      )
      const template = {
        grid: { ...p.grid, cells },
        ranks: p.ranks,
        facilities: p.facilities,
      }
      localStorage.setItem(DEFAULT_TEMPLATE_KEY, JSON.stringify(template))
    },

    hasDefault: () => localStorage.getItem(DEFAULT_TEMPLATE_KEY) != null,

    applyDefault: () => {
      const raw = localStorage.getItem(DEFAULT_TEMPLATE_KEY)
      if (!raw) return false
      const parsed = seatTemplateSchema.safeParse(JSON.parse(raw))
      if (!parsed.success) return false
      const tpl = parsed.data
      // レイアウト（グリッド・階級・設備）を差し替え、従業員(people)は引き継ぐ＝全員未配置になる
      mutate((p) => ({
        ...p,
        grid: tpl.grid,
        ranks: tpl.ranks,
        facilities: tpl.facilities,
      }))
      set({ selectedCell: null, selectedPersonId: null })
      return true
    },
  }
})

/** セレクタ: 人ID -> Person */
export function usePerson(personId: string | undefined): Person | undefined {
  return useSeatStore((s) => (personId ? s.project.people.find((p) => p.id === personId) : undefined))
}

/** 未配置の人（どのセルにも居ない） */
export function selectUnplacedPeople(s: SeatState): Person[] {
  const placed = new Set<string>()
  for (const c of s.project.grid.cells) {
    if (c.content.type === 'person') placed.add(c.content.personId)
  }
  return s.project.people.filter((p) => !placed.has(p.id))
}

/** rankId -> color を引く */
export function rankColor(project: SeatProject, rankId: string | null): string | null {
  if (!rankId) return null
  return project.ranks.find((r) => r.id === rankId)?.color ?? null
}
