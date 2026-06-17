import { createContext, useContext, useMemo, useState } from "react"

function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type PeriodCtx = {
  months: number; setMonths: (m: number) => void
  selectedMonth: string | null; setSelectedMonth: (m: string | null) => void
  from: string; to: string
}
const PeriodContext = createContext<PeriodCtx | null>(null)

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [months, setMonths] = useState(6)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const { from, to } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    return { from: isoDate(start), to: isoDate(now) }
  }, [months])
  return (
    <PeriodContext.Provider value={{ months, setMonths, selectedMonth, setSelectedMonth, from, to }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error("usePeriod must be used within a PeriodProvider")
  return ctx
}
