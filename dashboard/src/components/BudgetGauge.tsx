import { SectionCard } from "@/components/SectionCard"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format"
import { useLanguage } from "@/context/LanguageProvider"
import { cn } from "@/lib/utils"

export function BudgetGauge({
  used, budget, currency = "EUR",
}: {
  used: number
  budget?: number | null
  currency?: string
}) {
  const { t, language } = useLanguage()
  const hasBudget = typeof budget === "number" && budget > 0
  const pct = hasBudget ? (used / budget) * 100 : 0
  const over = pct > 80
  return (
    <SectionCard
      title={t("budgetConsumption")}
      actions={
        <Badge variant={over ? "destructive" : "secondary"}>
          {hasBudget ? `${Math.round(pct)}% ${t("used")}` : t("budgetNotConfigured")}
        </Badge>
      }
    >
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          data-testid="budget-bar"
          className={cn("h-full rounded-full transition-all", over ? "bg-orange-500" : "bg-primary")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm text-muted-foreground">
        <span>{t("consumed")}: {formatMoney(used, language, currency)}</span>
        <span>{t("budget")}: {hasBudget ? formatMoney(budget, language, currency) : t("budgetNotConfigured")}</span>
      </div>
    </SectionCard>
  )
}
