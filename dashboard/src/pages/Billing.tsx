import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import { usePeriod } from "@/context/PeriodContext"
import {
  useAccountBalance,
  useBills,
  useBillDetails,
} from "@/hooks/queries"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import type { Bill, BillDetail } from "@/services/api"

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function Billing() {
  const { t, language } = useLanguage()
  const { from, to } = usePeriod()
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)

  const balanceQuery = useAccountBalance()
  const billsQuery = useBills(from, to)
  const detailsQuery = useBillDetails(selectedBillId)

  if (billsQuery.isLoading) {
    return <BillingSkeleton />
  }

  if (billsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const balanceReady =
    !balanceQuery.isLoading && !balanceQuery.isError && balanceQuery.data != null

  const balance = balanceQuery.data
  const currency = balance?.currency ?? "EUR"

  const netBalance =
    balance?.net_balance !== undefined
      ? balance.net_balance
      : (balance?.credit_balance ?? 0) - (balance?.debt_balance ?? 0)

  const bills = billsQuery.data ?? []
  const selectedBill = selectedBillId ? bills.find((b) => b.id === selectedBillId) ?? null : null

  // Bills table columns
  const billCols: ColumnDef<Bill>[] = [
    {
      accessorKey: "date",
      header: t("billDate"),
    },
    {
      accessorKey: "id",
      header: t("invoiceId"),
    },
    {
      id: "amount",
      header: () => <div className="text-right">{t("amount")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.price_with_tax, language, row.original.currency)}
        </div>
      ),
    },
    {
      id: "paymentStatus",
      header: t("paymentStatus"),
      cell: ({ row }) => {
        const status = row.original.payment_status
        if (status === "paid") {
          return <Badge>{t("paid")}</Badge>
        }
        if (status) {
          return <Badge variant="secondary">{t("pending")}</Badge>
        }
        return <span>—</span>
      },
    },
    {
      id: "pdf",
      header: t("pdf"),
      cell: ({ row }) => {
        const url = row.original.pdf_url
        if (url) {
          return (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t("pdf")}
            </a>
          )
        }
        return <span>—</span>
      },
    },
  ]

  // Bill detail columns
  const detailCols: ColumnDef<BillDetail>[] = [
    {
      accessorKey: "description",
      header: t("description"),
    },
    {
      accessorKey: "domain",
      header: t("domain"),
    },
    {
      id: "amount",
      header: () => <div className="text-right">{t("amount")}</div>,
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.total_price, language, selectedBill?.currency ?? "EUR")}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Account balance KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("netBalance")}
          value={balanceReady ? formatMoney(netBalance, language, currency) : "—"}
          accent
        />
        <KpiCard
          label={t("creditBalance")}
          value={balanceReady ? formatMoney(balance!.credit_balance, language, currency) : "—"}
        />
        <KpiCard
          label={t("debtBalance")}
          value={balanceReady ? formatMoney(balance!.debt_balance, language, currency) : "—"}
        />
        <KpiCard
          label={t("deposits")}
          value={balanceReady ? formatMoney(balance!.deposit_total, language, currency) : "—"}
        />
      </div>

      {/* Bills table */}
      <SectionCard title={t("billing")}>
        <DataTable<Bill, unknown>
          columns={billCols}
          data={bills}
          onRowClick={(b) => setSelectedBillId(b.id)}
        />
      </SectionCard>

      {/* Bill detail drilldown */}
      {selectedBill && (
        <SectionCard title={selectedBill.id}>
          {/* Payment info */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {selectedBill.payment_status === "paid" ? (
              <Badge>{t("paid")}</Badge>
            ) : selectedBill.payment_status ? (
              <Badge variant="secondary">{t("pending")}</Badge>
            ) : null}
            <span>{selectedBill.payment_type ?? "—"}</span>
            <span>{selectedBill.payment_date ?? "—"}</span>
          </div>

          <DataTable<BillDetail, unknown>
            columns={detailCols}
            data={detailsQuery.data ?? []}
          />
        </SectionCard>
      )}
    </div>
  )
}
