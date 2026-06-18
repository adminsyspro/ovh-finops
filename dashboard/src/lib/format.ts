import { monthNames, type Lang } from "@/i18n/translations"

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" }

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code
}

export function formatCurrency(value: number | null | undefined, lang: Lang): string {
  const locale = lang === "en" ? "en-US" : "fr-FR"
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

export function formatMoney(
  value: number | null | undefined,
  lang: Lang,
  currency: string = "EUR",
): string {
  return `${formatCurrency(value, lang)} ${currencySymbol(currency)}`
}

export function formatMonthLabel(value: string, lang: Lang): string {
  const [year, month] = value.split("-")
  const idx = Number(month) - 1
  const name = monthNames[lang][idx] ?? month
  return `${name} ${year}`
}

export function trendMonthLabel(yearMonth: string, lang: Lang): string {
  const [year, month] = yearMonth.split("-")
  const name = (monthNames[lang][Number(month) - 1] ?? month).slice(0, 3)
  return `${name} ${year.slice(2)}`
}
