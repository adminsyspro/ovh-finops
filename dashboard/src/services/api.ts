import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// Handle 401 responses - redirect to login if OIDC is enabled
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const loginUrl = error.response.data?.loginUrl
      if (loginUrl) {
        // Redirect to OIDC login with return URL
        window.location.href = `${loginUrl}?returnTo=${encodeURIComponent(window.location.pathname)}`
        return new Promise(() => {}) // Never resolve
      }
    }
    return Promise.reject(error)
  }
)

export interface Month { value: string; label: string; from: string; to: string }
export interface SummaryProject { name: string; value: number }
export interface Summary {
  period: { from: string; to: string }
  total: number; cloudTotal: number; nonCloudTotal: number
  dailyAverage: number; billsCount: number; projectsCount: number
  topProjects: SummaryProject[]
}
export interface ServiceBreakdown { name: string; value: number; color: string; detailsCount: number }
export interface ProjectBreakdown { projectId: string; projectName: string; total: number; detailsCount: number }
export interface ResourceTypeBreakdown { name: string; resource_type: string; value: number; color: string; detailsCount: number; serviceCount: number }
export interface ExpiringService { id: string; display_name: string; type: string; expiration_date: string }
export interface AppConfig { budget: number; currency: string }

// Phase-3 interfaces (Consumption / Inventory / Billing)
export interface ConsumptionCurrent { snapshot_date?: string; period_start?: string | null; period_end?: string | null; current_total: number; currency: string; source?: string; project_count?: number; details?: unknown }
export interface ConsumptionForecast { snapshot_date?: string; period_start?: string; period_end?: string; forecast_total: number; current_total?: number; currency: string; progress?: number; source?: string; days_elapsed?: number; days_in_month?: number }
export interface UsageHistoryRow { period_start: string; period_end: string; total: number; currency: string; service_type: string | null }
export interface DedicatedServer { id: string; display_name: string; reverse: string | null; datacenter: string; os: string; state: string; cpu: string; ram_size: number; disk_info: { type: string; capacity: string; count: number }[]; bandwidth: number; expiration_date: string | null; renewal_type: string | null; imported_at: string }
export interface VpsInstance { id: string; display_name: string; model: string; zone: string; state: string; os: string; vcpus: number; ram_mb: number; disk_gb: number; expiration_date: string | null; renewal_type: string | null; ip_addresses: string[]; imported_at: string }
export interface StorageService { id: string; service_type: string; display_name: string; region: string; total_size_gb: number; used_size_gb: number; share_count: number | null; expiration_date: string | null; imported_at: string }
export interface InventorySummary { servers: number; vps: number; storage: number; cloud_projects: number; total: number; expiring_soon: number }
export interface Bill { id: string; date: string; price_without_tax: number; price_with_tax: number; tax: number; currency: string; pdf_url: string | null; html_url: string | null; imported_at: string; payment_type: string | null; payment_date: string | null; payment_status: string | null }
export interface BillDetail { id: string; bill_id: string; project_id: string | null; domain: string; description: string; quantity: number; unit_price: number; total_price: number; service_type: string; resource_type: string | null }
export interface BillPayment { bill_id: string; payment_type: string | null; payment_date: string | null; payment_status: string | null }
export interface AccountBalance { snapshot_date?: string; debt_balance: number; credit_balance: number; deposit_total: number; net_balance?: number; currency: string }
export interface CreditMovement { id: string; balance_name: string; amount: number; date: string; description: string; movement_type: string; imported_at: string }
export interface AccountDebts { debt_balance: number; currency: string }

// Phase-2 interfaces (Coûts data layer)
export interface EnrichedProject { id: string; name: string; description: string | null; status: string | null; instance_count: number; consumption_total: number; period_start: string | null; period_end: string | null }
export interface ProjectCostPoint { date: string; total: number; service_type: string }
export interface CloudInstance { id: string; project_id: string; name: string; flavor: string; plan_code: string | null; region: string; status: string; created_at: string | null; monthly_billing: number; imported_at: string }
export interface ProjectQuota { id: number; project_id: string; region: string; max_cores: number | null; max_instances: number | null; max_ram_mb: number | null; used_cores: number | null; used_instances: number | null; used_ram_mb: number | null; snapshot_date: string }
export interface ProjectBucket { name: string; type: string; total: number }
export interface ProjectConsumptionRow { id: number; project_id: string; period_start: string; period_end: string; resource_type: string; resource_id: string | null; resource_name: string; quantity: number; unit: string; unit_price: number; total_price: number; region: string | null; imported_at: string }
export interface InstanceTotal { total: number }
export interface ResourceTypeDetail { domain: string; description: string | null; total: number; line_count: number }
export interface MonthlyTrendPoint { month: string; yearMonth: string; cost: number }
export interface DailyTrendPoint { date: string; day: number; cost: number }

export const fetchMonths = async (): Promise<Month[]> => {
  const { data } = await api.get('/months')
  return data
}

export const fetchSummary = async (from: string, to: string): Promise<Summary> => {
  const { data } = await api.get('/summary', { params: { from, to } })
  return data
}

export const fetchProjects = async (): Promise<any> => {
  const { data } = await api.get('/projects')
  return data
}

export const fetchProjectsEnriched = async (): Promise<EnrichedProject[]> => {
  const { data } = await api.get('/projects/enriched')
  return data
}

export const fetchByProject = async (from: string, to: string): Promise<ProjectBreakdown[]> => {
  const { data } = await api.get('/analysis/by-project', { params: { from, to } })
  return data
}

export const fetchByService = async (from: string, to: string): Promise<ServiceBreakdown[]> => {
  const { data } = await api.get('/analysis/by-service', { params: { from, to } })
  return data
}

export const fetchDailyTrend = async (from: string, to: string): Promise<DailyTrendPoint[]> => {
  const { data } = await api.get('/analysis/daily-trend', { params: { from, to } })
  return data
}

export const fetchMonthlyTrend = async (months = 6): Promise<MonthlyTrendPoint[]> => {
  const { data } = await api.get('/analysis/monthly-trend', { params: { months } })
  return data
}

export const fetchImportStatus = async (): Promise<any> => {
  const { data } = await api.get('/import/status')
  return data
}

export const fetchConfig = async (): Promise<AppConfig> => {
  const { data } = await api.get('/config')
  return data
}

export const fetchUser = async (): Promise<any> => {
  const { data } = await api.get('/user')
  return data
}

// Phase 1: Consumption
export const fetchConsumptionCurrent = async (): Promise<ConsumptionCurrent> => {
  const { data } = await api.get('/consumption/current')
  return data
}

export const fetchConsumptionForecast = async (): Promise<ConsumptionForecast> => {
  const { data } = await api.get('/consumption/forecast')
  return data
}

export const fetchConsumptionHistory = async (from: string, to: string): Promise<UsageHistoryRow[]> => {
  const { data } = await api.get('/consumption/usage-history', { params: { from, to } })
  return data
}

// Phase 2: Account
export const fetchAccountBalance = async (): Promise<AccountBalance> => {
  const { data } = await api.get('/account/balance')
  return data
}

export const fetchAccountCredits = async (): Promise<CreditMovement[]> => {
  const { data } = await api.get('/account/credits')
  return data
}

export const fetchAccountDebts = async (): Promise<AccountDebts> => (await api.get('/account/debts')).data

// Phase 3: Inventory
export const fetchInventoryServers = async (): Promise<DedicatedServer[]> => {
  const { data } = await api.get('/inventory/servers')
  return data
}

export const fetchInventoryVps = async (): Promise<VpsInstance[]> => {
  const { data } = await api.get('/inventory/vps')
  return data
}

export const fetchInventoryStorage = async (): Promise<StorageService[]> => {
  const { data } = await api.get('/inventory/storage')
  return data
}

export const fetchInventorySummary = async (): Promise<InventorySummary> => {
  const { data } = await api.get('/inventory/summary')
  return data
}

// Phase 3: Bills
export const fetchBills = async (from?: string, to?: string): Promise<Bill[]> => {
  const params: Record<string, string> = {}
  if (from) params.from = from
  if (to) params.to = to
  const { data } = await api.get('/bills', Object.keys(params).length ? { params } : undefined)
  return data
}

export const fetchBillDetails = async (id: string): Promise<BillDetail[]> => {
  const { data } = await api.get(`/bills/${id}/details`)
  return data
}

export const fetchBillPayment = async (id: string): Promise<BillPayment> => {
  const { data } = await api.get(`/bills/${id}/payment`)
  return data
}

export const fetchExpiringServices = async (days = 30): Promise<ExpiringService[]> => {
  const { data } = await api.get('/inventory/expiring', { params: { days } })
  return data
}

export const fetchByResourceType = async (from: string, to: string): Promise<ResourceTypeBreakdown[]> => {
  const { data } = await api.get('/analysis/by-resource-type', { params: { from, to } })
  return data
}

export const fetchResourceTypeDetails = async (type: string, from: string, to: string): Promise<ResourceTypeDetail[]> => {
  const { data } = await api.get('/analysis/resource-type-details', { params: { type, from, to } })
  return data
}

// Phase 4: Cloud project details
export const fetchProjectConsumption = async (projectId: string, from: string, to: string): Promise<ProjectConsumptionRow[]> => {
  const { data } = await api.get(`/projects/${projectId}/consumption`, { params: { from, to } })
  return data
}

export const fetchProjectInstances = async (projectId: string): Promise<CloudInstance[]> => {
  const { data } = await api.get(`/projects/${projectId}/instances`)
  return data
}

export const fetchProjectQuotas = async (projectId: string): Promise<ProjectQuota[]> => {
  const { data } = await api.get(`/projects/${projectId}/quotas`)
  return data
}

export const fetchProjectBuckets = async (projectId: string, from: string, to: string): Promise<ProjectBucket[]> => {
  const { data } = await api.get(`/projects/${projectId}/buckets`, { params: { from, to } })
  return data
}

export const fetchProjectInstanceTotal = async (projectId: string, from: string, to: string): Promise<InstanceTotal> => {
  const { data } = await api.get(`/projects/${projectId}/instance-total`, { params: { from, to } })
  return data
}

export const fetchProjectCosts = async (id: string, from: string, to: string): Promise<ProjectCostPoint[]> => {
  const { data } = await api.get(`/projects/${id}/costs`, { params: { from, to } })
  return data
}

// GPU costs
export const fetchGpuSummary = async (from: string, to: string): Promise<any> => {
  const { data } = await api.get('/gpu/summary', { params: { from, to } })
  return data
}

// Public Cloud stats (Kubernetes, S3, Registry, etc.)
export const fetchPublicCloudStats = async (from: string, to: string): Promise<any> => {
  const { data } = await api.get('/analysis/public-cloud-stats', { params: { from, to } })
  return data
}

// Backup stats (Veeam)
export const fetchBackupStats = async (from: string, to: string): Promise<any> => {
  const { data } = await api.get('/analysis/backup-stats', { params: { from, to } })
  return data
}

export default api
