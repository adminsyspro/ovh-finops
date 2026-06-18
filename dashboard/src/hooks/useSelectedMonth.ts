import { usePeriod } from "@/context/PeriodContext"
import { useMonths } from "@/hooks/queries"

export function useSelectedMonth() {
  const { selectedMonth } = usePeriod()
  const monthsQuery = useMonths()
  const months = monthsQuery.data ?? []
  const idx = months.findIndex((m) => m.value === selectedMonth)
  const selected = idx >= 0 ? months[idx] : null
  const previous = idx >= 0 && idx < months.length - 1 ? months[idx + 1] : null
  return {
    monthsQuery,
    months,
    selected,
    previous,
    from: selected?.from,
    to: selected?.to,
  }
}
