import { useEffect } from "react"
import { useMonths } from "@/hooks/queries"
import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import { formatMonthLabel } from "@/lib/format"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function MonthPicker() {
  const { data: months } = useMonths()
  const { selectedMonth, setSelectedMonth } = usePeriod()
  const { language } = useLanguage()

  useEffect(() => {
    if (months && months.length > 0 && !months.some((m) => m.value === selectedMonth)) {
      setSelectedMonth(months[0].value)
    }
  }, [months, selectedMonth, setSelectedMonth])

  if (!months || months.length === 0) return null

  return (
    <Select value={selectedMonth ?? ""} onValueChange={setSelectedMonth}>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue>
          {selectedMonth ? formatMonthLabel(selectedMonth, language) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.value} value={m.value}>{formatMonthLabel(m.value, language)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
