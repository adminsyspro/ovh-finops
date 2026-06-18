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
})
