import { vi } from "vitest"
import { render, screen, act, waitFor } from "@testing-library/react"
import { MonthPicker } from "./MonthPicker"
import { PeriodProvider, usePeriod } from "@/context/PeriodContext"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/hooks/queries", () => ({
  useMonths: () => ({
    data: [
      { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
      { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
    ],
    isLoading: false,
  }),
}))

function Probe() {
  const { selectedMonth } = usePeriod()
  return <span data-testid="sel">{selectedMonth ?? "none"}</span>
}

test("MonthPicker sélectionne par défaut le mois le plus récent", () => {
  render(
    <LanguageProvider defaultLanguage="fr">
      <PeriodProvider>
        <MonthPicker />
        <Probe />
      </PeriodProvider>
    </LanguageProvider>,
  )
  expect(screen.getByTestId("sel").textContent).toBe("2026-05")
  // the trigger shows the selected month's label, derived from value in the active language
  expect(screen.getByText("Mai 2026")).toBeInTheDocument()
})

test("MonthPicker affiche un libellé dérivé en anglais", () => {
  render(
    <LanguageProvider defaultLanguage="en">
      <PeriodProvider>
        <MonthPicker />
      </PeriodProvider>
    </LanguageProvider>,
  )
  // server label is "Mai 2026"; the picker must show the English-derived label instead
  expect(screen.getByText("May 2026")).toBeInTheDocument()
  expect(screen.queryByText("Mai 2026")).not.toBeInTheDocument()
})

test("MonthPicker corrige un mois sélectionné absent de la liste", async () => {
  function Harness() {
    const { selectedMonth, setSelectedMonth } = usePeriod()
    return (
      <>
        <button onClick={() => setSelectedMonth("1999-01")}>stale</button>
        <MonthPicker />
        <span data-testid="sel">{selectedMonth ?? "none"}</span>
      </>
    )
  }
  render(
    <LanguageProvider defaultLanguage="fr">
      <PeriodProvider>
        <Harness />
      </PeriodProvider>
    </LanguageProvider>,
  )
  // after mount the picker defaults to the latest month
  expect(screen.getByTestId("sel").textContent).toBe("2026-05")
  // force a stale selection not present in the list
  await act(async () => { screen.getByText("stale").click() })
  // the effect must reset it back to the latest valid month
  await waitFor(() => expect(screen.getByTestId("sel").textContent).toBe("2026-05"))
})
