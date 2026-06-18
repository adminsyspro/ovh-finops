export type Lang = "fr" | "en"
export const translations: Record<Lang, Record<string, string>> = {
  fr: {
    // Header
    appTitle: 'OVH FinOps',
    appSubtitle: 'Tableau de bord de suivi des coûts OVHcloud',
    overviewDescription: 'Vue synthétique des coûts, projets et alertes du mois sélectionné.',
    projectsDescription: 'Analyse des projets Public Cloud, instances et consommations détaillées.',
    servicesDescription: 'Répartition des coûts par service, produit et type de ressource.',
    compareDescription: 'Comparaison de deux périodes pour détecter les variations importantes.',
    trendsDescription: 'Évolution historique des coûts et projections sur plusieurs mois.',
    consumptionDescription: 'Consommation courante, prévision de fin de mois et solde du compte.',
    inventoryDescription: 'Inventaire opérationnel des ressources OVHcloud et services à échéance.',
    billingDescription: 'Suivi des factures, paiements et détails des lignes de facturation.',
    export: 'Export',
    choose: 'Choisir...',
    markdown: 'Markdown',
    pdf: 'PDF',
    period: 'Période',
    months: 'Mois',
    years: 'Années',
    months3: '3 mois',
    months6: '6 mois',
    months12: '12 mois',
    months24: '24 mois',
    months36: '36 mois',

    // Tabs
    overview: "Vue d'ensemble",
    compare: 'Comparaison',
    trends: 'Tendances',

    // Nav (Phase 0 redesign)
    projects: "Projets",
    byService: "Par service",
    consumption: "Consommation",
    billing: "Facturation",
    costsGroup: "Coûts",
    opsGroup: "Exploitation",
    general: "Général",

    // KPI Cards
    totalCost: 'Coût total du mois',
    cloudTotal: 'Cloud Total',
    nonCloudTotal: 'Bare Metal',
    cloudShare: 'Part Cloud',
    invoices: 'Factures',
    monthlySnapshot: 'Synthèse mensuelle',
    strongestCostDriver: 'Principal poste de coût',
    publicCloud: 'Public Cloud',
    dailyAverage: 'Coût moyen / jour',
    over30Days: 'Sur 30 jours',
    activeProjects: 'Projets actifs',
    withConsumption: 'avec consommation',
    vsPreviousMonth: 'vs mois précédent',
    noPreviousData: 'Pas de données précédentes',

    // Budget
    budgetConsumption: 'Consommation du budget',
    used: 'utilisé',
    consumed: 'Consommé',
    budget: 'Budget',

    // Overview
    serviceBreakdown: 'Répartition par service',
    topService: 'Service principal',
    serviceFamilies: 'Familles de services',
    billingLines: 'lignes de facturation',
    trackedResources: 'Ressources suivies',
    topResourceType: 'Type dominant',
    costDistribution: 'Distribution des coûts',
    clickResourceType: 'Cliquez une ligne pour afficher le détail',
    topProjects: 'Top projets consommateurs Cloud',
    projectBreakdown: 'Répartition par projet',
    project: 'Projet',
    amount: 'Montant',
    totalCloud: 'Total Cloud',

    // Compare
    monthA: 'Mois A',
    monthB: 'Mois B',
    vs: 'VS',
    serviceComparison: 'Comparaison par service',
    projectComparison: 'Comparaison par projet',
    variation: 'Variation',

    // Trends
    evolutionOver: 'Évolution sur',
    noDataAvailable: 'Pas de données disponibles pour cette période',
    periodGrowth: 'Croissance sur la période',
    overLast: 'Sur les',
    lastMonths: 'derniers mois',
    mostExpensiveMonth: 'Mois le plus coûteux',
    annualProjection: 'Projection annuelle',
    basedOnLastMonth: 'Basé sur le dernier mois',
    dailyTrend: 'Tendance quotidienne',

    // Footer
    syncedVia: 'Données synchronisées via l\'API OVHcloud',
    lastSync: 'Dernière sync',
    bills: 'factures',

    // Loading
    loading: 'Chargement des données...',

    // Sync warning
    syncWarning: 'Dernière synchronisation il y a',
    syncWarningDays: 'jours',
    syncWarningAction: 'Exécutez',
    syncWarningToUpdate: 'pour mettre à jour.',
    dismiss: 'Fermer',

    // Consumption (Phase 1)
    currentConsumption: 'Consommation en cours',
    forecastEndOfMonth: 'Prévision fin de mois',
    selectedPeriod: 'Période sélectionnée',
    consumptionProgress: 'Progression',
    consumptionHistory: 'Historique de consommation',

    // Account (Phase 2)
    accountBalance: 'Solde du compte',
    debtBalance: 'Dette',
    creditBalance: 'Crédits',
    deposits: 'Dépôts',
    netBalance: 'Solde net',
    paymentStatus: 'Statut paiement',
    paid: 'Payé',
    pending: 'En attente',
    billDate: 'Date',
    invoiceId: 'N° facture',

    // Inventory (Phase 3)
    inventory: 'Public Cloud',
    infrastructure: 'Infrastructure',
    backup: 'Backup',
    cpu: 'CPU',
    model: 'Modèle',
    size: 'Taille',
    shares: 'Partages',
    dedicatedServers: 'Serveurs dédiés',
    vpsInstances: 'VPS',
    storageServices: 'Stockage',
    cloudProjects: 'Projets Cloud',
    totalResources: 'Total ressources',
    resourceType: 'Type de ressource',
    domain: 'Domaine',
    description: 'Description',
    datacenter: 'Datacenter',
    specs: 'Spécifications',
    expirationDate: 'Date d\'expiration',
    renewal: 'Renouvellement',
    state: 'État',
    resourceTypeBreakdown: 'Répartition par type de ressource',
    expiringSoon: 'Expirations proches',
    expiringIn: 'Expire dans',
    days: 'jours',
    expired: 'Expiré',
    noExpirations: 'Aucune expiration proche',

    // Cloud details (Phase 4)
    instances: 'Instances',
    quotas: 'Quotas',
    flavor: 'Flavor',
    region: 'Région',
    monthlyBilling: 'Facturation mensuelle',
    usedOf: 'utilisé sur',
    cores: 'Cores',
    ram: 'RAM',
    buckets: 'Buckets',
    type: 'Type',
    name: 'Nom',

    // GPU
    gpuCosts: 'Coûts GPU',
    gpuTotal: 'Total GPU',
    gpuByModel: 'Par modèle GPU',
    gpuByProject: 'Par projet',
    gpuInstances: 'Instances GPU',
    gpuFlavors: 'Types GPU',
    noGpuData: 'Aucune donnée GPU',

    // Months
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    april: 'Avril',
    may: 'Mai',
    june: 'Juin',
    july: 'Juillet',
    august: 'Août',
    september: 'Septembre',
    october: 'Octobre',
    november: 'Novembre',
    december: 'Décembre'
  },
  en: {
    // Header
    appTitle: 'OVH FinOps',
    appSubtitle: 'OVHcloud cost tracking dashboard',
    overviewDescription: 'Cost, project, and alert snapshot for the selected month.',
    projectsDescription: 'Public Cloud project analysis with instances and detailed consumption.',
    servicesDescription: 'Cost breakdown by service, product, and resource type.',
    compareDescription: 'Compare two periods to spot meaningful cost changes.',
    trendsDescription: 'Historical cost evolution and multi-month projections.',
    consumptionDescription: 'Current usage, end-of-month forecast, and account balance.',
    inventoryDescription: 'Operational inventory for OVHcloud resources and expiring services.',
    billingDescription: 'Invoices, payments, and billing line details.',
    export: 'Export',
    choose: 'Choose...',
    markdown: 'Markdown',
    pdf: 'PDF',
    period: 'Period',
    months: 'Months',
    years: 'Years',
    months3: '3 months',
    months6: '6 months',
    months12: '12 months',
    months24: '24 months',
    months36: '36 months',

    // Tabs
    overview: 'Overview',
    compare: 'Compare',
    trends: 'Trends',

    // Nav (Phase 0 redesign)
    projects: "Projects",
    byService: "By service",
    consumption: "Consumption",
    billing: "Billing",
    costsGroup: "Costs",
    opsGroup: "Operations",
    general: "General",

    // KPI Cards
    totalCost: 'Total monthly cost',
    cloudTotal: 'Cloud Total',
    nonCloudTotal: 'Bare Metal',
    cloudShare: 'Cloud share',
    invoices: 'Invoices',
    monthlySnapshot: 'Monthly snapshot',
    strongestCostDriver: 'Main cost driver',
    publicCloud: 'Public Cloud',
    dailyAverage: 'Daily average cost',
    over30Days: 'Over 30 days',
    activeProjects: 'Active projects',
    withConsumption: 'with consumption',
    vsPreviousMonth: 'vs previous month',
    noPreviousData: 'No previous data',

    // Budget
    budgetConsumption: 'Budget consumption',
    used: 'used',
    consumed: 'Consumed',
    budget: 'Budget',

    // Overview
    serviceBreakdown: 'Breakdown by service',
    topService: 'Top service',
    serviceFamilies: 'Service families',
    billingLines: 'billing lines',
    trackedResources: 'Tracked resources',
    topResourceType: 'Top resource type',
    costDistribution: 'Cost distribution',
    clickResourceType: 'Click a row to show details',
    topProjects: 'Top consuming Cloud projects',
    projectBreakdown: 'Breakdown by project',
    project: 'Project',
    amount: 'Amount',
    totalCloud: 'Cloud Total',

    // Compare
    monthA: 'Month A',
    monthB: 'Month B',
    vs: 'VS',
    serviceComparison: 'Comparison by service',
    projectComparison: 'Comparison by project',
    variation: 'Variation',

    // Trends
    evolutionOver: 'Evolution over',
    noDataAvailable: 'No data available for this period',
    periodGrowth: 'Growth over period',
    overLast: 'Over the last',
    lastMonths: 'months',
    mostExpensiveMonth: 'Most expensive month',
    annualProjection: 'Annual projection',
    basedOnLastMonth: 'Based on last month',
    dailyTrend: 'Daily trend',

    // Footer
    syncedVia: 'Data synchronized via OVHcloud API',
    lastSync: 'Last sync',
    bills: 'bills',

    // Loading
    loading: 'Loading data...',

    // Sync warning
    syncWarning: 'Last synchronization was',
    syncWarningDays: 'days ago',
    syncWarningAction: 'Run',
    syncWarningToUpdate: 'to update.',
    dismiss: 'Dismiss',

    // Consumption (Phase 1)
    currentConsumption: 'Current consumption',
    forecastEndOfMonth: 'End of month forecast',
    selectedPeriod: 'Selected period',
    consumptionProgress: 'Progress',
    consumptionHistory: 'Consumption history',

    // Account (Phase 2)
    accountBalance: 'Account balance',
    debtBalance: 'Debt',
    creditBalance: 'Credits',
    deposits: 'Deposits',
    netBalance: 'Net balance',
    paymentStatus: 'Payment status',
    paid: 'Paid',
    pending: 'Pending',
    billDate: 'Date',
    invoiceId: 'Invoice #',

    // Inventory (Phase 3)
    inventory: 'Public Cloud',
    infrastructure: 'Infrastructure',
    backup: 'Backup',
    cpu: 'CPU',
    model: 'Model',
    size: 'Size',
    shares: 'Shares',
    dedicatedServers: 'Dedicated Servers',
    vpsInstances: 'VPS',
    storageServices: 'Storage',
    cloudProjects: 'Cloud Projects',
    totalResources: 'Total resources',
    resourceType: 'Resource type',
    domain: 'Domain',
    description: 'Description',
    datacenter: 'Datacenter',
    specs: 'Specifications',
    expirationDate: 'Expiration date',
    renewal: 'Renewal',
    state: 'State',
    resourceTypeBreakdown: 'Breakdown by resource type',
    expiringSoon: 'Expiring soon',
    expiringIn: 'Expires in',
    days: 'days',
    expired: 'Expired',
    noExpirations: 'No upcoming expirations',

    // Cloud details (Phase 4)
    instances: 'Instances',
    quotas: 'Quotas',
    flavor: 'Flavor',
    region: 'Region',
    monthlyBilling: 'Monthly billing',
    usedOf: 'used of',
    cores: 'Cores',
    ram: 'RAM',
    buckets: 'Buckets',
    type: 'Type',
    name: 'Name',

    // GPU
    gpuCosts: 'GPU Costs',
    gpuTotal: 'GPU Total',
    gpuByModel: 'By GPU model',
    gpuByProject: 'By project',
    gpuInstances: 'GPU Instances',
    gpuFlavors: 'GPU types',
    noGpuData: 'No GPU data',

    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December'
  }
}

export const monthNames: Record<Lang, string[]> = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
}

export const monthNamesShort: Record<Lang, string[]> = {
  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

export default translations
