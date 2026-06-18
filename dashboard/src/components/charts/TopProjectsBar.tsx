import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/context/LanguageProvider"

const config: ChartConfig = { total: { label: "Total", color: "var(--chart-1)" } }

export function TopProjectsBar({
  data,
}: {
  data: { projectName: string; total: number }[]
}) {
  const { t } = useLanguage()
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
  }
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="projectName"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
