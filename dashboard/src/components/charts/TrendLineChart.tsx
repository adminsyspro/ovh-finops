import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/context/LanguageProvider"

export function TrendLineChart({
  data, variant = "line",
}: {
  data: { label: string; cost: number }[]
  variant?: "line" | "area"
}) {
  const { t } = useLanguage()

  const config: ChartConfig = {
    cost: { label: t("amount"), color: "var(--chart-1)" },
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
  }

  if (variant === "area") {
    return (
      <ChartContainer config={config} className="h-[340px] w-full">
        <AreaChart accessibilityLayer data={data} margin={{ left: 8, right: 16, top: 12, bottom: 8 }}>
          <defs>
            <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.32} />
              <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickMargin={10} />
          <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={60} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="cost"
            fill="url(#costFill)"
            stroke="var(--color-cost)"
            strokeWidth={2}
            type="monotone"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis domain={[0, "auto"]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={60} />
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
