import { create } from 'zustand'
import type {
  CellContent,
  FacilityKind,
  Person,
  Rank,
  SeatProject,
} from '@shared/types'
import { cellIndex, resizeGrid } from '@renderer/lib/grid'
import { uid } from '@renderer/lib/id'
import { createSampleProject } from '@renderer/lib/project'

export interface CellPos {
  row: number
  col: number
}

interface SeatState {
  project: SeatProject
  filePath: string | null
  dirty: boolean
  selected: CellPos | null

  // グリッド
  setGridSize: (rows: number, cols: number) => void

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

  // ファイル入出力
  newProject: () => void
  loadProject: (path: string, project: SeatProject) => void
  markSaved: (path: string) => void
}

export const useSeatStore = create<SeatState>((set) => {
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
    selected: null,

    setGridSize: (rows, cols) =>
      mutate((p) => {
        const { grid, overflow } = resizeGrid(p.grid, rows, cols)
        // はみ出した中身は人/設備として残る（people/facilities は消さない）ので grid 差し替えのみ
        void overflow
        return { ...p, grid }
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

    removePerson: (id) =>
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
      })),

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

    selectCell: (pos) => set({ selected: pos }),

    newProject: () =>
      set({ project: createSampleProject(), filePath: null, dirty: false, selected: null }),

    loadProject: (path, project) =>
      set({ project, filePath: path, dirty: false, selected: null }),

    markSaved: (path) => set({ filePath: path, dirty: false }),
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
