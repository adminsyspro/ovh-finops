import { formatCurrency, currencySymbol, formatMoney, formatMonthLabel, trendMonthLabel } from "./format"

test("formatCurrency: 2 décimales, locale en/fr", () => {
  expect(formatCurrency(1234.5, "en")).toBe("1,234.50")
  expect(formatCurrency(0, "en")).toBe("0.00")
  // fr-FR uses a (narrow) space as thousands separator; assert structure, not the exact space char
  expect(formatCurrency(1234.5, "fr")).toMatch(/^1\s?234,50$/)
  expect(formatCurrency(null, "fr")).toMatch(/^0,00$/)
})

test("currencySymbol mappe les codes connus", () => {
  expect(currencySymbol("EUR")).toBe("€")
  expect(currencySymbol("USD")).toBe("$")
  expect(currencySymbol("CHF")).toBe("CHF")
})

test("formatMoney accole le symbole", () => {
  expect(formatMoney(10, "en")).toBe("10.00 €")
  expect(formatMoney(10, "en", "USD")).toBe("10.00 $")
})

test("formatMonthLabel dérive le libellé selon la langue", () => {
  expect(formatMonthLabel("2026-05", "fr")).toBe("Mai 2026")
  expect(formatMonthLabel("2026-05", "en")).toBe("May 2026")
})

test("trendMonthLabel: court + langue", () => {
  expect(trendMonthLabel("2026-05", "en")).toBe("May 26")
  expect(trendMonthLabel("2026-01", "fr")).toBe("Jan 26")
})

test("trendMonthLabel: Juin et Juillet distincts en français", () => {
  expect(trendMonthLabel("2026-06", "fr")).toBe("Juin 26")
  expect(trendMonthLabel("2026-07", "fr")).toBe("Juil 26")
  expect(trendMonthLabel("2026-06", "fr")).not.toBe(trendMonthLabel("2026-07", "fr"))
})
