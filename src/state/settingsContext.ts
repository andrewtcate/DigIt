import { createContext, useContext } from 'react'
import type { Cabin, Settings } from '../types'

export interface SettingsStore {
  settings: Settings
  setHome: (label: string, lat: number, lng: number) => void
  setMaxDrive: (minutes: number) => void
  toggleAirport: (iata: string) => void
  setBudget: (usd: number | null) => void
  setBalance: (programId: string, value: number) => void
  setCabin: (c: Cabin) => void
  setMonthsAhead: (m: number) => void
  resetSettings: () => void
}

export const SettingsContext = createContext<SettingsStore | null>(null)

export function useSettings(): SettingsStore {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
