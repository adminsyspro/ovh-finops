import { render, screen } from "@testing-library/react"
import { DonutChart } from "./DonutChart"
import { TopProjectsBar } from "./TopProjectsBar"
import { LanguageProvider } from "@/context/LanguageProvider"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="en">{ui}</LanguageProvider>)
}

test("DonutChart rend une légende avec noms et montants", () => {
  wrap(<DonutChart data={[{ name: "Compute", value: 12.5, color: "#123456" }]} />)
  expect(screen.getByText("Compute")).toBeInTheDocument()
  expect(screen.getByText(/12\.50 €/)).toBeInTheDocument()
})

test("DonutChart respects currency prop (USD → $)", () => {
  wrap(<DonutChart data={[{ name: "Compute", value: 12.5, color: "#123456" }]} currency="USD" />)
  expect(screen.getByText(/12\.50 \$/)).toBeInTheDocument()
})

test("DonutChart vide → message", () => {
  wrap(<DonutChart data={[]} />)
  expect(screen.getByText("No data available for this period")).toBeInTheDocument()
})

test("TopProjectsBar se monte sans erreur (et gère le vide)", () => {
  const { rerender } = wrap(<TopProjectsBar data={[{ projectName: "p1", total: 9 }]} />)
  rerender(
    <LanguageProvider defaultLanguage="en">
      <TopProjectsBar data={[]} />
    </LanguageProvider>,
  )
  expect(screen.getByText("No data available for this period")).toBeInTheDocument()
})
