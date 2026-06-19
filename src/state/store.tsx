import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Cabin, RewardsBalances, Settings } from '../types'
import { inferDepartureAirports } from '../lib/geo'
import { load, save } from '../lib/storage'
import { SettingsContext, type SettingsStore } from './settingsContext'

const TAMPA = { label: 'Tampa, FL', lat: 27.9506, lng: -82.4572 }
const SETTINGS_KEY = 'farescout:settings:v1'

function defaultSettings(): Settings {
  return {
    homeLabel: TAMPA.label,
    homeLat: TAMPA.lat,
    homeLng: TAMPA.lng,
    departureAirports: inferDepartureAirports(TAMPA.lat, TAMPA.lng, { maxDriveMinutes: 150 }),
    maxDriveMinutes: 150,
    cashBudgetUSD: null,
    balances: {},
    cabin: 'any',
    monthsAhead: 4,
    configured: false,
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    load<Settings>(SETTINGS_KEY, defaultSettings()),
  )

  useEffect(() => {
    save(SETTINGS_KEY, settings)
  }, [settings])

  const setHome = useCallback((label: string, lat: number, lng: number) => {
    setSettings((s) => ({
      ...s,
      homeLabel: label,
      homeLat: lat,
      homeLng: lng,
      departureAirports: inferDepartureAirports(lat, lng, { maxDriveMinutes: s.maxDriveMinutes }),
      configured: true,
    }))
  }, [])

  const setMaxDrive = useCallback((minutes: number) => {
    setSettings((s) => {
      const inferred = inferDepartureAirports(s.homeLat, s.homeLng, { maxDriveMinutes: minutes })
      // Preserve which airports the user explicitly removed by re-inferring fresh;
      // simplest correct behavior is to re-derive the suggested set.
      return { ...s, maxDriveMinutes: minutes, departureAirports: inferred }
    })
  }, [])

  const toggleAirport = useCallback((iata: string) => {
    setSettings((s) => {
      const exists = s.departureAirports.some((a) => a.iata === iata)
      if (exists) {
        const next = s.departureAirports.filter((a) => a.iata !== iata)
        return { ...s, departureAirports: next.length ? next : s.departureAirports }
      }
      // Re-add from the full inferred pool (wider radius) if it was removed.
      const pool = inferDepartureAirports(s.homeLat, s.homeLng, {
        maxDriveMinutes: Math.max(s.maxDriveMinutes, 600),
        maxAirports: 30,
      })
      const found = pool.find((a) => a.iata === iata)
      if (!found) return s
      const next = [...s.departureAirports, found].sort((a, b) => a.driveMinutes - b.driveMinutes)
      return { ...s, departureAirports: next }
    })
  }, [])

  const setBudget = useCallback((usd: number | null) => {
    setSettings((s) => ({ ...s, cashBudgetUSD: usd }))
  }, [])

  const setBalance = useCallback((programId: string, value: number) => {
    setSettings((s) => {
      const balances: RewardsBalances = { ...s.balances }
      if (value > 0) balances[programId] = value
      else delete balances[programId]
      return { ...s, balances }
    })
  }, [])

  const setCabin = useCallback((c: Cabin) => setSettings((s) => ({ ...s, cabin: c })), [])
  const setMonthsAhead = useCallback((m: number) => setSettings((s) => ({ ...s, monthsAhead: m })), [])
  const resetSettings = useCallback(() => setSettings(defaultSettings()), [])

  const value = useMemo<SettingsStore>(
    () => ({
      settings,
      setHome,
      setMaxDrive,
      toggleAirport,
      setBudget,
      setBalance,
      setCabin,
      setMonthsAhead,
      resetSettings,
    }),
    [settings, setHome, setMaxDrive, toggleAirport, setBudget, setBalance, setCabin, setMonthsAhead, resetSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
