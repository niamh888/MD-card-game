import Link from 'next/link'
import { ArrowRight, Building2, Calendar, Cpu, ExternalLink, FileCheck2, Globe, Sparkles } from 'lucide-react'
import { getDashboardData, type Count } from '@/lib/fda'
import { Donut, TrendChart } from '@/components/dashboard/charts'
import { WorldMap } from '@/components/dashboard/world-map'

export const revalidate = 86400

const fmt = new Intl.NumberFormat('en-US')

function StatCard({ icon: Icon, label, value, note }: { icon: typeof Cpu; label: string; value: string; note: string }) {
  return (
    <div className="rounded-[20px] border border-brand-200 bg-white p-5 shadow-[0_8px_24px_rgba(26,26,46,0.04)]">
      <div className="mb-3 flex items-center gap-2 text-brand-700">
        <Icon size={17} />
        <span className="text-xs font-bold uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-[-0.03em] text-brand-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-brand-600">{note}</p>
    </div>
  )
}

function BarList({ title, items }: { title: string; items: Count[] }) {
  const max = Math.max(...items.map((i) => i.count))
  return (
    <section className="rounded-[20px] border border-brand-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-bold text-brand-800">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span className="truncate font-medium text-brand-700">{item.label}</span>
              <span className="font-bold text-brand-700">{fmt.format(item.count)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MarketLink({ title, text, href, button }: { title: string; text: string; href: string; button: string }) {
  return (
    <section className="flex flex-col justify-between gap-4 rounded-[20px] border border-brand-200 bg-brand-100 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold text-brand-800"><Globe size={17} className="text-gold-700" /> {title}</h2>
        <p className="mt-1 text-xs leading-5 text-brand-700">{text}</p>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm">
        {button} <ExternalLink size={14} />
      </a>
    </section>
  )
}

export default async function Page() {
  let data
  try {
    data = await getDashboardData()
  } catch {
    return (
      <main className="min-h-screen bg-brand-100 p-10 text-brand-900">
        <h1 className="text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="mt-2 text-sm text-brand-600">Could not load FDA data right now. Please refresh in a moment.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-brand-100 text-brand-900">
      <header className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-900 text-gold-300 shadow-sm"><Sparkles size={19} strokeWidth={2.5} /></div>
            <div className="text-[17px] font-bold tracking-[-0.03em] text-brand-900">Medical device dashboard</div>
          </div>
          <Link href="/study" className="rounded-full border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm">Learn: Study deck</Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">United States · FDA data</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-brand-900 sm:text-[40px]">AI medical devices on the market</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-brand-600">Live figures from the FDA AI-enabled device list and openFDA. Global coverage is not included yet.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Cpu} label="AI devices" value={fmt.format(data.aiTotal)} note="Authorised by the FDA to date" />
          <StatCard icon={Building2} label="AI companies" value={fmt.format(data.aiCompanies)} note="Distinct companies with an AI device" />
          <StatCard icon={FileCheck2} label={`${data.latestYear} decisions`} value={fmt.format(data.latestYearCount)} note={`Latest decision ${data.latestDecision}`} />
          <StatCard icon={Calendar} label="Device listings" value={data.activeListings === null ? 'n/a' : fmt.format(data.activeListings)} note="Active FDA-registered device listings (all devices, not companies)" />
        </div>

        <section className="mt-6 rounded-[20px] border border-brand-200 bg-white p-5">
          <h2 className="text-sm font-bold text-brand-800">AI device decisions per year</h2>
          <p className="mb-3 text-xs text-brand-600">Bars: decisions each year. Gold line: cumulative total.</p>
          <TrendChart data={data.byYear} />
        </section>

        {data.listingsByCountry.length > 0 && (
          <section className="mt-6 rounded-[20px] border border-brand-200 bg-white p-5">
            <h2 className="text-sm font-bold text-brand-800">Where devices come from</h2>
            <p className="mb-3 text-xs text-brand-600">Active FDA device listings by country of the registered establishment (all device types, not only AI). Darker is more; hover a country for the count.</p>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
              <WorldMap data={data.listingsByCountry} />
              <BarList title="Top countries" items={data.listingsByCountry.slice(0, 8)} />
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[20px] border border-brand-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-brand-800">AI devices by specialty</h2>
            <Donut items={[...data.bySpecialty.slice(0, 6), { label: 'Other', count: data.bySpecialty.slice(6).reduce((s, i) => s + i.count, 0) }]} />
          </section>
          <BarList title="Top companies" items={data.topCompanies.slice(0, 8)} />
        </div>

        <section className="mt-6 flex flex-col gap-5 rounded-[20px] bg-brand-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Learn more</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Want to learn about medical device development?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-300">
              Try our Study Deck: free flashcards on medical device terms, from regulatory affairs and quality to AI-enabled devices. Pick a topic or your role and test yourself.
            </p>
          </div>
          <Link href="/study" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-brand-900 shadow-sm hover:bg-gold-300">
            Start learning <ArrowRight size={16} />
          </Link>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <MarketLink
            title="EU market"
            href="https://ec.europa.eu/tools/eudamed"
            button="Open EUDAMED"
            text="Devices on the EU market are registered in EUDAMED, the European Commission's database. Registration became mandatory on 28 May 2026, and devices already on the market have until 27 November 2026, so counts are still incomplete. Search the public database directly for current records."
          />
          <MarketLink
            title="UK market"
            href="https://pard.mhra.gov.uk"
            button="Open MHRA PARD"
            text="The MHRA's Public Access Registration Database (PARD) lists registered manufacturers and the device types they have registered. Registration is not approval or endorsement by the MHRA. Search the public register directly for current records."
          />
        </div>

        <p className="mt-6 text-xs text-brand-600">Sources: FDA AI-Enabled Medical Devices list; openFDA device registration and listing. Data refreshes daily.</p>
      </div>

      <footer className="border-t border-brand-200 bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-6 text-center text-sm text-brand-700 lg:px-10">
          Developed by{' '}
          <a href="https://www.stjohnlynch.com" target="_blank" rel="noopener noreferrer" className="font-bold text-gold-700 underline-offset-4 hover:underline">
            St John Lynch
          </a>
        </div>
      </footer>
    </main>
  )
}
