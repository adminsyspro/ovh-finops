import { useQuery } from "@tanstack/react-query"
import {
  fetchMonths, fetchConfig, fetchSummary, fetchByService, fetchByProject,
  fetchByResourceType, fetchExpiringServices,
  fetchProjectsEnriched, fetchProjectCosts, fetchProjectInstances, fetchProjectQuotas,
  fetchProjectBuckets, fetchProjectConsumption, fetchProjectInstanceTotal,
  fetchResourceTypeDetails, fetchMonthlyTrend, fetchDailyTrend,
  fetchConsumptionCurrent, fetchConsumptionForecast, fetchConsumptionHistory,
  fetchInventoryServers, fetchInventoryVps, fetchInventoryStorage, fetchInventorySummary,
  fetchBills, fetchBillDetails, fetchBillPayment,
  fetchAccountBalance, fetchAccountCredits, fetchAccountDebts,
} from "@/services/api"

export function useMonths() {
  return useQuery({ queryKey: ["months"], queryFn: fetchMonths })
}

export function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: fetchConfig })
}

export function useSummary(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["summary", from, to],
    queryFn: () => fetchSummary(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useByService(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["byService", from, to],
    queryFn: () => fetchByService(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useByProject(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["byProject", from, to],
    queryFn: () => fetchByProject(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useByResourceType(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["byResourceType", from, to],
    queryFn: () => fetchByResourceType(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useExpiring(days = 30) {
  return useQuery({ queryKey: ["expiring", days], queryFn: () => fetchExpiringServices(days) })
}

// Phase-2: Coûts data layer hooks
export function useProjectsEnriched(from?: string | null, to?: string | null) {
  return useQuery({
    queryKey: ["projectsEnriched", from, to],
    queryFn: () => fetchProjectsEnriched(from ?? undefined, to ?? undefined),
  })
}

export function useProjectCosts(id: string | null | undefined, from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["projectCosts", id, from, to],
    queryFn: () => fetchProjectCosts(id!, from!, to!),
    enabled: !!id && !!from && !!to,
  })
}

export function useProjectInstances(id: string | null | undefined) {
  return useQuery({
    queryKey: ["projectInstances", id],
    queryFn: () => fetchProjectInstances(id!),
    enabled: !!id,
  })
}

export function useProjectQuotas(id: string | null | undefined) {
  return useQuery({
    queryKey: ["projectQuotas", id],
    queryFn: () => fetchProjectQuotas(id!),
    enabled: !!id,
  })
}

export function useProjectBuckets(id: string | null | undefined, from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["projectBuckets", id, from, to],
    queryFn: () => fetchProjectBuckets(id!, from!, to!),
    enabled: !!id && !!from && !!to,
  })
}

export function useProjectConsumption(id: string | null | undefined, from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["projectConsumption", id, from, to],
    queryFn: () => fetchProjectConsumption(id!, from!, to!),
    enabled: !!id && !!from && !!to,
  })
}

export function useProjectInstanceTotal(id: string | null | undefined, from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["projectInstanceTotal", id, from, to],
    queryFn: () => fetchProjectInstanceTotal(id!, from!, to!),
    enabled: !!id && !!from && !!to,
  })
}

export function useResourceTypeDetails(type: string | null | undefined, from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["resourceTypeDetails", type, from, to],
    queryFn: () => fetchResourceTypeDetails(type!, from!, to!),
    enabled: !!type && !!from && !!to,
  })
}

export function useMonthlyTrend(months = 6) {
  return useQuery({ queryKey: ["monthlyTrend", months], queryFn: () => fetchMonthlyTrend(months) })
}

export function useDailyTrend(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["dailyTrend", from, to],
    queryFn: () => fetchDailyTrend(from!, to!),
    enabled: !!from && !!to,
  })
}

// Phase-3 hooks (Consumption / Inventory / Billing)
export function useConsumptionCurrent(from?: string | null, to?: string | null) {
  return useQuery({
    queryKey: ["consumptionCurrent", from, to],
    queryFn: () => fetchConsumptionCurrent(from ?? undefined, to ?? undefined),
    enabled: (!from && !to) || (!!from && !!to),
  })
}

export function useConsumptionForecast(from?: string | null, to?: string | null) {
  return useQuery({
    queryKey: ["consumptionForecast", from, to],
    queryFn: () => fetchConsumptionForecast(from ?? undefined, to ?? undefined),
    enabled: (!from && !to) || (!!from && !!to),
  })
}

export function useConsumptionHistory(from: string | null | undefined, to: string | null | undefined) {
  return useQuery({
    queryKey: ["consumptionHistory", from, to],
    queryFn: () => fetchConsumptionHistory(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useInventoryServers() {
  return useQuery({ queryKey: ["inventoryServers"], queryFn: fetchInventoryServers })
}

export function useInventoryVps() {
  return useQuery({ queryKey: ["inventoryVps"], queryFn: fetchInventoryVps })
}

export function useInventoryStorage() {
  return useQuery({ queryKey: ["inventoryStorage"], queryFn: fetchInventoryStorage })
}

export function useInventorySummary() {
  return useQuery({ queryKey: ["inventorySummary"], queryFn: fetchInventorySummary })
}

export function useBills(from?: string, to?: string) {
  return useQuery({ queryKey: ["bills", from, to], queryFn: () => fetchBills(from, to) })
}

export function useBillDetails(id: string | null | undefined) {
  return useQuery({
    queryKey: ["billDetails", id],
    queryFn: () => fetchBillDetails(id!),
    enabled: !!id,
  })
}

export function useBillPayment(id: string | null | undefined) {
  return useQuery({
    queryKey: ["billPayment", id],
    queryFn: () => fetchBillPayment(id!),
    enabled: !!id,
  })
}

export function useAccountBalance() {
  return useQuery({ queryKey: ["accountBalance"], queryFn: fetchAccountBalance })
}

export function useAccountCredits() {
  return useQuery({ queryKey: ["accountCredits"], queryFn: fetchAccountCredits })
}

export function useAccountDebts() {
  return useQuery({ queryKey: ["accountDebts"], queryFn: fetchAccountDebts })
}
