import { useQuery } from "@tanstack/react-query"
import {
  fetchMonths, fetchConfig, fetchSummary, fetchByService, fetchByProject,
  fetchByResourceType, fetchExpiringServices,
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
