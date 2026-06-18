import { usePeriod } from "@/context/PeriodContext"
import { useMonths } from "@/hooks/queries"
import { type Month } from "@/services/api"

export type PeriodSelection = Month & { kind: "month" | "year" }

export function yearPeriodValue(year: string | number) {
  return `year:${year}`
}

export function isYearPeriodValue(value: string | null | undefined) {
  return !!value && value.startsWith("year:")
}

export function getYearPeriods(months: Month[]): PeriodSelection[] {
  const years = Array.from(new Set(months.map((m) => m.value.slice(0, 4))))
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a))

  return years.map((year) => ({
    value: yearPeriodValue(year),
    label: year,
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    kind: "year",
  }))
}

export function useSelectedMonth() {
  const { selectedMonth } = usePeriod()
  const monthsQuery = useMonths()
  const months = monthsQuery.data ?? []
  const monthPeriods: PeriodSelection[] = months.map((m) => ({ ...m, kind: "month" }))
  const yearPeriods = getYearPeriods(months)
  const periods = [...yearPeriods, ...monthPeriods]
  const idx = periods.findIndex((m) => m.value === selectedMonth)
  const monthIdx = monthPeriods.findIndex((m) => m.value === selectedMonth)
  const selected = idx >= 0 ? periods[idx] : null
  const previous = selected?.kind === "year"
    ? yearPeriods.find((period) => Number(period.value.slice(5)) === Number(selected.value.slice(5)) - 1) ?? null
    : monthIdx >= 0 && monthIdx < monthPeriods.length - 1
      ? monthPeriods[monthIdx + 1] ?? null
      : null
  return {
    monthsQuery,
    months,
    periods,
    yearPeriods,
    selected,
    previous,
    from: selected?.from,
    to: selected?.to,
  }
}
