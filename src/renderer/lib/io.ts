import { toPng } from 'html-to-image'
import { seatProjectSchema } from '@shared/schema'
import { useSeatStore } from '@renderer/stores/useSeatStore'

export async function saveProject(saveAs = false): Promise<void> {
  const { project, filePath, markSaved } = useSeatStore.getState()
  const targetPath = saveAs ? null : filePath
  const res = await window.seatmap.file.save(targetPath, project, project.meta.title)
  if (res) markSaved(res.path)
}

export async function openProject(): Promise<void> {
  const res = await window.seatmap.file.open()
  if (!res) return
  const parsed = seatProjectSchema.safeParse(res.project)
  if (!parsed.success) {
    alert('このファイルは SeatMap の座席表として読み込めませんでした。')
    return
  }
  useSeatStore.getState().loadProject(res.path, parsed.data)
}

function chartTitle(): string {
  return useSeatStore.getState().project.meta.title || 'seatmap'
}

export async function exportPdf(): Promise<void> {
  const path = await window.seatmap.export.pdf(chartTitle())
  if (path) await window.seatmap.reveal(path)
}

export async function exportPng(): Promise<void> {
  const node = document.getElementById('printable-seatchart')
  if (!node) return
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  const buffer = await (await fetch(dataUrl)).arrayBuffer()
  const path = await window.seatmap.export.png(chartTitle(), buffer)
  if (path) await window.seatmap.reveal(path)
}

export async function printChart(): Promise<void> {
  await window.seatmap.print()
}
