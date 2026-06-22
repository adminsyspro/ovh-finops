import {
  type ColumnDef, type FilterFn, type SortingState, flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { ArrowUpDown, Search } from "lucide-react"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useLanguage } from "@/context/LanguageProvider"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { type ServiceDetail } from "@/services/api"

const serviceDetailGlobalFilter: FilterFn<ServiceDetail> = (row, _columnId, filterValue) => {
  const needle = String(filterValue ?? "").trim().toLowerCase()
  if (!needle) return true

  const detail = row.original
  return [
    detail.billDate,
    detail.billId,
    detail.domain,
    detail.description,
    detail.lineCount,
    detail.total,
  ].some((value) => String(value ?? "").toLowerCase().includes(needle))
}

export function ServiceDetailSheet({
  open,
  onOpenChange,
  serviceName,
  total,
  rows,
  isLoading,
  isError,
  currency,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string | null
  total?: number
  rows: ServiceDetail[]
  isLoading?: boolean
  isError?: boolean
  currency: string
}) {
  const { t, language } = useLanguage()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const columns: ColumnDef<ServiceDetail>[] = [
    {
      accessorKey: "billDate",
      header: t("billDate"),
      cell: ({ row }) => <span className="tabular-nums">{row.original.billDate}</span>,
    },
    {
      accessorKey: "billId",
      header: t("invoiceId"),
      cell: ({ row }) => <span className="tabular-nums">{row.original.billId}</span>,
    },
    {
      accessorKey: "domain",
      header: t("domain"),
      cell: ({ row }) => <span className="break-all">{row.original.domain}</span>,
    },
    {
      id: "description",
      header: t("description"),
      cell: ({ row }) => <span className="whitespace-normal break-words">{row.original.description ?? "—"}</span>,
    },
    {
      accessorKey: "lineCount",
      header: t("billingLines"),
      cell: ({ row }) => <span className="tabular-nums">{row.original.lineCount}</span>,
    },
    {
      accessorKey: "total",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.total, language, currency)}
        </div>
      ),
    },
  ]
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: serviceDetailGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[96vw] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none lg:w-[94vw] xl:w-[92vw] 2xl:w-[88vw]">
        <SheetHeader>
          <SheetTitle>{serviceName ? `${t("serviceDetails")} · ${serviceName}` : t("serviceDetails")}</SheetTitle>
          {typeof total === "number" && (
            <SheetDescription>{formatMoney(total, language, currency)}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="h-[calc(100vh-9rem)] w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/50 p-6 text-center text-sm text-destructive">
              {t("serviceDetailsError")}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative max-w-sm shrink-0">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder={t("serviceDetailsSearch")}
                  className="h-9 bg-card pl-8"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
                <Table className="min-w-[980px] table-fixed">
                  <colgroup>
                    <col className="w-[9rem]" />
                    <col className="w-[10rem]" />
                    <col className="w-[22%]" />
                    <col />
                    <col className="w-[8rem]" />
                    <col className="w-[10rem]" />
                  </colgroup>
                  <TableHeader className="sticky top-0 z-10">
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => {
                          const canSort = header.column.getCanSort()
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder ? null : canSort ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="-ml-3 h-8 text-xs font-semibold"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  <ArrowUpDown className="ml-2 size-3.5" />
                                </Button>
                              ) : (
                                flexRender(header.column.columnDef.header, header.getContext())
                              )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "whitespace-normal align-top",
                                cell.column.id === "total" && "text-right",
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                          {t("noDataAvailable")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
