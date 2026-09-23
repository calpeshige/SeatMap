/// <reference types="vite/client" />

import type { SeatApi } from './shared/ipc-contract'

declare global {
  interface Window {
    seatmap: SeatApi
  }
}

export {}
