import { render, screen } from "@testing-library/react"
import { ExpiringAlerts, daysUntil } from "./ExpiringAlerts"
import { LanguageProvider } from "@/context/LanguageProvider"
import type { ExpiringService } from "@/services/api"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("daysUntil arrondit au jour supérieur", () => {
  const now = new Date("2026-06-18T00:00:00Z")
  expect(daysUntil("2026-06-23", now)).toBe(5)
})

test("liste vide → message 'aucune expiration'", () => {
  wrap(<ExpiringAlerts services={[]} />)
  expect(screen.getByText("Aucune expiration proche")).toBeInTheDocument()
})

test("affiche le nom, le badge de type et les jours restants", () => {
  const services: ExpiringService[] = [
    { id: "s1", display_name: "ns1.example", type: "dedicated_server", expiration_date: "2099-01-01" },
  ]
  wrap(<ExpiringAlerts services={services} />)
  expect(screen.getByText("ns1.example")).toBeInTheDocument()
  expect(screen.getByText("Serveurs dédiés")).toBeInTheDocument()
  const daysText = screen.getByText(/Expire dans \d+ jours/)
  expect(daysText).toBeInTheDocument()
  expect(daysText).toHaveClass("text-orange-600")
})

test("colore les jours restants en rouge à 7 jours ou moins", () => {
  const soon = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)
  wrap(<ExpiringAlerts services={[
    { id: "s2", display_name: "vps1", type: "vps", expiration_date: soon },
  ]} />)
  expect(screen.getByText(/Expire dans \d+ jours/)).toHaveClass("text-red-600")
})
