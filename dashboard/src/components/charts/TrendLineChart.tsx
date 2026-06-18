import { Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/context/LanguageProvider"

export function TrendLineChart({
  data,
}: {
  data: { label: string; cost: number }[]
}) {
  const { t } = useLanguage()

  const config: ChartConfig = {
    cost: { label: t("amount"), color: "var(--chart-1)" },
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
  }

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={60} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="cost"
          stroke="var(--color-cost)"
          strokeWidth={2}
          dot
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  )
}
