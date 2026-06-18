import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({
    months: 6,
    setMonths: () => {},
    from: "2026-01-01",
    to: "2026-06-18",
  }),
}))

import * as queries from "@/hooks/queries"

vi.mock("@/hooks/queries", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  return {
    useMonthlyTrend: vi.fn(() =>
      ok([
        { yearMonth: "2026-04", month: "Avr", cost: 100 },
        { yearMonth: "2026-05", month: "Mai", cost: 150 },
      ]),
    ),
    useDailyTrend: vi.fn(() =>
      ok([
        { date: "2026-05-01", day: "01", cost: 5 },
        { date: "2026-05-02", day: "02", cost: 6 },
      ]),
    ),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
  }
})

import { Trends } from "./Trends"

const { useMonthlyTrend } = queries

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="en">{ui}</LanguageProvider>)
}

beforeEach(() => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  vi.mocked(useMonthlyTrend).mockReturnValue(
    ok([
      { yearMonth: "2026-04", month: "Avr", cost: 100 },
      { yearMonth: "2026-05", month: "Mai", cost: 150 },
    ]) as any,
  )
})

test("Trends page: mostExpensiveMonth label is present", () => {
  wrap(<Trends />)
  expect(screen.getByText("Most expensive month")).toBeInTheDocument()
})

test("Trends page: annualProjection with ~ prefix is present", () => {
  wrap(<Trends />)
  // last.cost = 150, 150 * 12 = 1800 → "~1,800.00 €" or similar format
  const node = screen.getByText(/~/)
  expect(node).toBeInTheDocument()
})

test("Trends page: periodGrowth +50.0% is present", () => {
  wrap(<Trends />)
  // (150 - 100) / 100 * 100 = +50.0%
  expect(screen.getByText(/\+50\.0%/)).toBeInTheDocument()
})

test("Trends page: periodGrowth label is present", () => {
  wrap(<Trends />)
  expect(screen.getByText("Growth over period")).toBeInTheDocument()
})

test("Trends page: annualProjection label is present", () => {
  wrap(<Trends />)
  expect(screen.getByText("Annual projection")).toBeInTheDocument()
})

test("Trends page: monthly error → error block shown, stats not shown", () => {
  vi.mocked(useMonthlyTrend).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
  } as any)
  wrap(<Trends />)
  expect(
    screen.getByText("No data available for this period"),
  ).toBeInTheDocument()
  expect(screen.queryByText("Most expensive month")).not.toBeInTheDocument()
})

test("Trends page: projection uses configured currency (USD → $)", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  vi.mocked(queries.useConfig).mockReturnValue(
    ok({ budget: 1000, currency: "USD" }) as any,
  )
  wrap(<Trends />)
  // 150 * 12 = 1,800 → formatMoney with USD → contains "$"
  const projectionNode = screen.getByText(/~/)
  expect(projectionNode.textContent).toMatch(/\$/)
})
