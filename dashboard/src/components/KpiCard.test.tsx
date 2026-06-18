import { render, screen } from "@testing-library/react"
import { KpiCard } from "./KpiCard"
import { LanguageProvider } from "@/context/LanguageProvider"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("KpiCard affiche label/valeur/sous-libellé", () => {
  wrap(<KpiCard label="Coût total du mois" value="1 234,56 €" sublabel="mai" />)
  expect(screen.getByText("Coût total du mois")).toBeInTheDocument()
  expect(screen.getByText("1 234,56 €")).toBeInTheDocument()
  expect(screen.getByText("mai")).toBeInTheDocument()
})

test("KpiCard: delta positif en rouge, null en 'pas de données'", () => {
  const { rerender } = wrap(<KpiCard label="x" value="0" delta={5} />)
  const up = screen.getByText(/\+5\.0%/)
  expect(up).toHaveClass("text-red-500")
  rerender(
    <LanguageProvider defaultLanguage="fr">
      <KpiCard label="x" value="0" delta={null} />
    </LanguageProvider>,
  )
  expect(screen.getByText("Pas de données précédentes")).toBeInTheDocument()
})

test("KpiCard: delta négatif en vert", () => {
  wrap(<KpiCard label="x" value="0" delta={-3.2} />)
  expect(screen.getByText(/-3\.2%/)).toHaveClass("text-green-500")
})

test("KpiCard: deltaLabel vide supprime le suffixe 'vs mois précédent'", () => {
  wrap(<KpiCard label="x" value="0" delta={5} deltaLabel="" />)
  const el = screen.getByText(/\+5\.0%/)
  expect(el).toBeInTheDocument()
  expect(el.textContent).not.toContain("vs mois précédent")
  expect(el.textContent).not.toContain("vs previous month")
})

test("KpiCard: sans deltaLabel, le suffixe 'vs mois précédent' reste affiché (compat rétro)", () => {
  wrap(<KpiCard label="x" value="0" delta={5} />)
  expect(screen.getByText(/vs mois précédent/)).toBeInTheDocument()
})
