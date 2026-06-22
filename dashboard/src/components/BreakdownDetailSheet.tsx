import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/DataTable"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/context/LanguageProvider"
import { formatMoney } from "@/lib/format"
import { type BreakdownDetailRow } from "@/services/api"

export function BreakdownDetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  rows,
  isLoading,
  isError,
  currency,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  rows: BreakdownDetailRow[]
  isLoading?: boolean
  isError?: boolean
  currency: string
}) {
  const { t, language } = useLanguage()

  const columns: ColumnDef<BreakdownDetailRow>[] = [
    {
      accessorKey: "period",
      header: t("period"),
    },
    {
      accessorKey: "invoiceId",
      header: t("invoiceId"),
    },
    {
      accessorKey: "domain",
      header: t("domain"),
    },
    {
      id: "description",
      header: t("description"),
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      accessorKey: "lineCount",
      header: t("billingLines"),
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/50 p-6 text-center text-sm text-destructive">
              {t("breakdownDetailsError")}
            </div>
          ) : (
            <DataTable<BreakdownDetailRow, unknown>
              columns={columns}
              data={rows}
              searchPlaceholder={t("domain")}
              pageSize={8}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
