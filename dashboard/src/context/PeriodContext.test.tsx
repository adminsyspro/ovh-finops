import { render, screen, act } from "@testing-library/react"
import { PeriodProvider, usePeriod } from "./PeriodContext"

function Probe() {
  const { months, setMonths, from, to } = usePeriod()
  return <button onClick={() => setMonths(12)}>{months}|{from}|{to}</button>
}

test("expose months + plage from/to dérivée et réagit à setMonths", () => {
  render(<PeriodProvider><Probe /></PeriodProvider>)
  const btn = screen.getByRole("button")
  expect(btn.textContent).toMatch(/^6\|/)            // défaut 6 mois
  expect(btn.textContent).toMatch(/\d{4}-\d{2}-\d{2}\|\d{4}-\d{2}-\d{2}$/)
  act(() => btn.click())
  expect(btn.textContent).toMatch(/^12\|/)
})
