import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useLanguage } from "@/context/LanguageProvider"

export function ServiceCompareBars({
  data,
}: {
  data: { name: string; moisA: number; moisB: number }[]
}) {
  const { t } = useLanguage()

  const config: ChartConfig = {
    moisA: { label: t("monthA"), color: "var(--chart-1)" },
    moisB: { label: t("monthB"), color: "var(--chart-2)" },
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
  }

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 16 }}>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="moisA" fill="var(--color-moisA)" radius={4} />
        <Bar dataKey="moisB" fill="var(--color-moisB)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
