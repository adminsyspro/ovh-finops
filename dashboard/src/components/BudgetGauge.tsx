import { SectionCard } from "@/components/SectionCard"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/format"
import { useLanguage } from "@/context/LanguageProvider"
import { cn } from "@/lib/utils"

export function BudgetGauge({
  used, budget, currency = "EUR",
}: {
  used: number
  budget: number
  currency?: string
}) {
  const { t, language } = useLanguage()
  const pct = budget > 0 ? (used / budget) * 100 : 0
  const over = pct > 80
  return (
    <SectionCard
      title={t("budgetConsumption")}
      actions={
        <Badge variant={over ? "destructive" : "secondary"}>
          {Math.round(pct)}% {t("used")}
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
        <span>{t("budget")}: {formatMoney(budget, language, currency)}</span>
      </div>
    </SectionCard>
  )
}
