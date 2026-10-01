import readXlsxFile from 'read-excel-file/node'

const AI_LIST_URL = 'https://www.fda.gov/media/178540/download'
const COUNTRY_URL = 'https://api.fda.gov/device/registrationlisting.json?search=registration.status_code:1&count=registration.iso_country_code&limit=1000'
const REGISTRATION_URL = 'https://api.fda.gov/device/registrationlisting.json?search=registration.status_code:1&limit=1'

export type Count = { label: string; count: number }

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

function tally(values: string[]): Count[] {
  const map = new Map<string, number>()
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1)
  return [...map].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

async function getAiDevices() {
  const res = await fetch(AI_LIST_URL, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`FDA AI device list responded ${res.status}`)
  const [{ data }] = await readXlsxFile(Buffer.from(await res.arrayBuffer()))
  return data.slice(1).filter((row) => row[0]).map((row) => ({
    date: String(row[0]),
    company: String(row[3] ?? '').trim(),
    specialty: String(row[4] ?? 'Unknown').trim(),
  }))
}

async function getActiveListings(): Promise<number | null> {
  try {
    const res = await fetch(REGISTRATION_URL, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    return (await res.json()).meta.results.total
  } catch {
    return null
  }
}

async function getListingsByCountry(): Promise<Count[]> {
  try {
    const res = await fetch(COUNTRY_URL, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const { results } = (await res.json()) as { results: { term: string; count: number }[] }
    return results.map((r) => ({ label: r.term, count: r.count }))
  } catch {
    return []
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [devices, activeListings, listingsByCountry] = await Promise.all([getAiDevices(), getActiveListings(), getListingsByCountry()])
  const years = devices.map((d) => Number(d.date.slice(-4)))
  const byYear = tally(years.map(String)).sort((a, b) => Number(a.label) - Number(b.label))
  const latest = byYear.at(-1)!
  const latestDecision = devices
    .map((d) => d.date)
    .sort((a, b) => `${b.slice(-4)}${b}`.localeCompare(`${a.slice(-4)}${a}`))[0]

  return {
    aiTotal: devices.length,
    aiCompanies: new Set(devices.map((d) => d.company.toLowerCase())).size,
    latestYear: Number(latest.label),
    latestYearCount: latest.count,
    byYear,
    bySpecialty: tally(devices.map((d) => d.specialty)),
    topCompanies: tally(devices.map((d) => d.company)),
    activeListings,
    listingsByCountry,
    latestDecision,
  }
}
