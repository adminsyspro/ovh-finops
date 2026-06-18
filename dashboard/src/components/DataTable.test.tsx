import { render, screen, fireEvent, within } from "@testing-library/react"
import { vi } from "vitest"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./DataTable"
import { LanguageProvider } from "@/context/LanguageProvider"

type Row = { name: string; total: number }
const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "total", header: "Total" },
]
const data: Row[] = [
  { name: "Bravo", total: 30 },
  { name: "Alpha", total: 10 },
  { name: "Charlie", total: 20 },
]
function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("rend les lignes et filtre via la recherche", () => {
  wrap(<DataTable columns={columns} data={data} />)
  expect(screen.getByText("Bravo")).toBeInTheDocument()
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "alph" } })
  expect(screen.getByText("Alpha")).toBeInTheDocument()
  expect(screen.queryByText("Bravo")).not.toBeInTheDocument()
})

test("trie sur clic d'en-tête (name)", () => {
  wrap(<DataTable columns={columns} data={data} />)
  const headerButton = screen.getByRole("button", { name: /Name/ })
  expect(headerButton).toHaveAttribute("type", "button")
  fireEvent.click(headerButton)
  const rows = screen.getAllByRole("row")
  // first body row after header should be Alpha asc
  expect(within(rows[1]).getByText("Alpha")).toBeInTheDocument()
})

test("clic de ligne déclenche onRowClick", () => {
  const onRowClick = vi.fn()
  wrap(<DataTable columns={columns} data={data} onRowClick={onRowClick} />)
  fireEvent.click(screen.getByText("Charlie"))
  expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ name: "Charlie" }))
})
