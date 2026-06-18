import { render, screen } from "@testing-library/react"
import { BudgetGauge } from "./BudgetGauge"
import { LanguageProvider } from "@/context/LanguageProvider"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="en">{ui}</LanguageProvider>)
}

test("BudgetGauge: 50% sous le seuil → barre primaire", () => {
  wrap(<BudgetGauge used={500} budget={1000} />)
  expect(screen.getByText(/50% used/)).toBeInTheDocument()
  const bar = screen.getByTestId("budget-bar")
  expect(bar).toHaveStyle({ width: "50%" })
  expect(bar.className).toContain("bg-primary")
})

test("BudgetGauge: > 80% → barre orange, largeur plafonnée à 100%", () => {
  wrap(<BudgetGauge used={1200} budget={1000} />)
  expect(screen.getByText(/120% used/)).toBeInTheDocument()
  const bar = screen.getByTestId("budget-bar")
  expect(bar).toHaveStyle({ width: "100%" })
  expect(bar.className).toContain("bg-orange-500")
})

test("BudgetGauge: budget absent → indique non configuré", () => {
  wrap(<BudgetGauge used={10} budget={null} />)
  expect(screen.getAllByText(/Not configured/).length).toBeGreaterThan(0)
  const bar = screen.getByTestId("budget-bar")
  expect(bar).toHaveStyle({ width: "0%" })
})
