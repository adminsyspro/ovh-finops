import { useEffect, useMemo } from "react"
import { CalendarDays } from "lucide-react"
import { useMonths } from "@/hooks/queries"
import { getYearPeriods, isYearPeriodValue } from "@/hooks/useSelectedMonth"
import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import { formatMonthLabel, formatYearLabel } from "@/lib/format"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function MonthPicker() {
  const { data: months } = useMonths()
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const { t, language } = useLanguage()
  const years = useMemo(() => getYearPeriods(months ?? []), [months])
  const validValues = useMemo(
    () => new Set([...(months ?? []).map((m) => m.value), ...years.map((y) => y.value)]),
    [months, years],
  )

  useEffect(() => {
    if (months && months.length > 0 && !validValues.has(selectedMonth ?? "")) {
      setSelectedMonth(months[0].value)
    }
  }, [months, selectedMonth, setSelectedMonth, validValues])

  if (!months || months.length === 0) return null
  const selectedLabel = selectedMonth && isYearPeriodValue(selectedMonth)
    ? formatYearLabel(selectedMonth, language)
    : selectedMonth
      ? formatMonthLabel(selectedMonth, language)
      : undefined

  return (
    <Select value={selectedMonth ?? ""} onValueChange={setSelectedMonth}>
      <SelectTrigger size="sm" className="w-[156px] border-border bg-card shadow-xs sm:w-[172px]">
        <CalendarDays className="size-4 text-muted-foreground" />
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t("years")}</SelectLabel>
          {years.map((year) => (
            <SelectItem key={year.value} value={year.value}>{formatYearLabel(year.value, language)}</SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>{t("months")}</SelectLabel>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{formatMonthLabel(m.value, language)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
