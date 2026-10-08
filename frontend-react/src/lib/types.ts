// A label with a number, e.g. { label: 'Radiology', count: 1230 }. Used by every chart.
export type Count = { label: string; count: number }

// The shape of the JSON that the Flask backend sends at /api/dashboard.
export type DashboardData = {
  aiTotal: number
  aiCompanies: number
  latestYear: number
  latestYearCount: number
  byYear: Count[]
  bySpecialty: Count[]
  topCompanies: Count[]
  activeListings: number | null
  listingsByCountry: Count[]
  latestDecision: string
}
