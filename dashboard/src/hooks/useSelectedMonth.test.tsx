import { vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { PeriodProvider } from "@/context/PeriodContext"

const MONTHS = [
  { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
  { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
]

vi.mock("@/context/PeriodContext", async (orig) => {
  const real = await orig<typeof import("@/context/PeriodContext")>()
  return {
    ...real,
    usePeriod: vi.fn(() => ({ selectedMonth: "2026-05", setSelectedMonth: () => {} })),
  }
})

vi.mock("@/hooks/queries", () => ({
  useMonths: vi.fn(() => ({
    data: MONTHS,
    isLoading: false,
    isError: false,
  })),
}))

import { useSelectedMonth } from "./useSelectedMonth"

test("useSelectedMonth: selected matches selectedMonth value", () => {
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.selected?.value).toBe("2026-05")
})

test("useSelectedMonth: previous is the next-older month", () => {
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.previous?.value).toBe("2026-04")
})

test("useSelectedMonth: from/to come from the selected month", () => {
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.from).toBe("2026-05-01")
  expect(result.current.to).toBe("2026-05-31")
})

test("useSelectedMonth: from/to couvrent l'année complète quand une année est sélectionnée", async () => {
  const { usePeriod } = await import("@/context/PeriodContext")
  vi.mocked(usePeriod).mockReturnValueOnce({ selectedMonth: "year:2026", setSelectedMonth: () => {} } as any)
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.selected?.kind).toBe("year")
  expect(result.current.from).toBe("2026-01-01")
  expect(result.current.to).toBe("2026-12-31")
})

test("useSelectedMonth: months array is exposed", () => {
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.months).toHaveLength(2)
})

test("useSelectedMonth: previous is null when selectedMonth is the oldest available", async () => {
  const { usePeriod } = await import("@/context/PeriodContext")
  vi.mocked(usePeriod).mockReturnValueOnce({ selectedMonth: "2026-04", setSelectedMonth: () => {} } as any)
  const { result } = renderHook(() => useSelectedMonth(), {
    wrapper: PeriodProvider,
  })
  expect(result.current.previous).toBeNull()
})
