import { vi } from "vitest"
import api, {
  fetchSummary, fetchByService, fetchExpiringServices, fetchMonths, type Summary,
  fetchProjectsEnriched, fetchResourceTypeDetails, fetchServiceDetails, fetchMonthlyTrend, fetchProjectBuckets,
  fetchBills, fetchBillDetails, fetchInventorySummary, fetchAccountBalance,
  fetchConsumptionCurrent, fetchConsumptionForecast,
} from "@/services/api"

test("fetchSummary appelle /summary avec from/to et renvoie le corps typé", async () => {
  const body: Summary = {
    period: { from: "2026-05-01", to: "2026-05-31" },
    total: 100, cloudTotal: 80, nonCloudTotal: 20,
    dailyAverage: 3.33, billsCount: 2, projectsCount: 4, topProjects: [{ name: "p", value: 80 }],
  }
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: body })
  const res = await fetchSummary("2026-05-01", "2026-05-31")
  expect(spy).toHaveBeenCalledWith("/summary", { params: { from: "2026-05-01", to: "2026-05-31" } })
  expect(res.total).toBe(100)
  spy.mockRestore()
})

test("fetchByService et fetchExpiringServices ciblent les bons endpoints", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: [] })
  await fetchByService("a", "b")
  expect(spy).toHaveBeenCalledWith("/analysis/by-service", { params: { from: "a", to: "b" } })
  await fetchExpiringServices(30)
  expect(spy).toHaveBeenCalledWith("/inventory/expiring", { params: { days: 30 } })
  await fetchMonths()
  expect(spy).toHaveBeenCalledWith("/months")
  spy.mockRestore()
})

test("phase-2 fetchers hit the right endpoints", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: [] })
  await fetchProjectsEnriched(); expect(spy).toHaveBeenCalledWith("/projects/enriched", undefined)
  await fetchProjectsEnriched("a", "b"); expect(spy).toHaveBeenLastCalledWith("/projects/enriched", { params: { from: "a", to: "b" } })
  await fetchServiceDetails("Compute", "a", "b"); expect(spy).toHaveBeenLastCalledWith("/analysis/service-details", { params: { service: "Compute", from: "a", to: "b" } })
  await fetchResourceTypeDetails("vps", "a", "b"); expect(spy).toHaveBeenLastCalledWith("/analysis/resource-type-details", { params: { type: "vps", from: "a", to: "b" } })
  await fetchMonthlyTrend(6); expect(spy).toHaveBeenLastCalledWith("/analysis/monthly-trend", { params: { months: 6 } })
  await fetchProjectBuckets("p1", "a", "b"); expect(spy).toHaveBeenLastCalledWith("/projects/p1/buckets", { params: { from: "a", to: "b" } })
  spy.mockRestore()
})

test("phase-3 fetchers hit the right endpoints", async () => {
  const spy = vi.spyOn(api, "get").mockResolvedValue({ data: {} })
  await fetchInventorySummary(); expect(spy).toHaveBeenLastCalledWith("/inventory/summary")
  await fetchAccountBalance(); expect(spy).toHaveBeenLastCalledWith("/account/balance")
  await fetchBillDetails("FR123"); expect(spy).toHaveBeenLastCalledWith("/bills/FR123/details")
  await fetchBills("a", "b"); expect(spy).toHaveBeenLastCalledWith("/bills", { params: { from: "a", to: "b" } })
  // one-sided and no-arg bill filters
  await fetchBills("a"); expect(spy).toHaveBeenLastCalledWith("/bills", { params: { from: "a" } })
  await fetchBills(); expect(spy).toHaveBeenLastCalledWith("/bills", undefined)
  await fetchConsumptionCurrent("a", "b"); expect(spy).toHaveBeenLastCalledWith("/consumption/current", { params: { from: "a", to: "b" } })
  await fetchConsumptionForecast("a", "b"); expect(spy).toHaveBeenLastCalledWith("/consumption/forecast", { params: { from: "a", to: "b" } })
  spy.mockRestore()
})
