import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ from: "2026-01-01", to: "2026-06-18" }),
}))

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => ({
  useAccountBalance: vi.fn(() =>
    ok({
      debt_balance: 10,
      credit_balance: 50,
      deposit_total: 0,
      net_balance: 40,
      currency: "EUR",
    }),
  ),
  useAccountCredits: vi.fn(() => ok([])),
  useBills: vi.fn(() =>
    ok([
      {
        id: "FR1",
        date: "2026-05-01",
        price_without_tax: 100,
        price_with_tax: 120,
        tax: 20,
        currency: "EUR",
        pdf_url: null,
        html_url: null,
        imported_at: "2026-05-02",
        payment_type: "credit_card",
        payment_date: "2026-05-03",
        payment_status: "paid",
      },
    ]),
  ),
  useBillDetails: vi.fn(() => ok([])),
}))

import { Billing } from "./Billing"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("Billing page: net balance 40,00 is rendered", () => {
  wrap(<Billing />)
  expect(screen.getByText(/40,00/)).toBeInTheDocument()
})

test("Billing page: bill id FR1 is rendered", () => {
  wrap(<Billing />)
  expect(screen.getByText("FR1")).toBeInTheDocument()
})

test("Billing page: payment status 'Payé' badge is rendered", () => {
  wrap(<Billing />)
  expect(screen.getByText("Payé")).toBeInTheDocument()
})
