import { useQuery } from "@tanstack/react-query"
import {
  fetchMonths, fetchConfig, fetchSummary, fetchByService, fetchByProject,
  fetchByResourceType, fetchExpiringServices,
  fetchProjectsEnriched, fetchProjectCosts, fetchProjectInstances, fetchProjectQuotas,
  fetchProjectBuckets, fetchProjectConsumption, fetchProjectInstanceTotal,
  fetchResourceTypeDetails, fetchMonthlyTrend, fetchDailyTrend,
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
export function useProjectsEnriched() {
  return useQuery({ queryKey: ["projectsEnriched"], queryFn: fetchProjectsEnriched })
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
