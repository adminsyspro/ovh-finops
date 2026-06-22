import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { formatMoney } from "@/lib/format"
import { useLanguage } from "@/context/LanguageProvider"

export function DonutChart({
  data,
  currency = "EUR",
}: {
  data: { name: string; value: number; color: string }[]
  currency?: string
}) {
  const { t, language } = useLanguage()
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
  }
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.color }]),
  )
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ChartContainer config={config} className="mx-auto aspect-square h-[220px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex-1 space-y-1 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatMoney(d.value, language, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
