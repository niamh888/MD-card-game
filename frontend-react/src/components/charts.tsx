import type { Count } from '@/lib/types'

const fmt = new Intl.NumberFormat('en-US')
// Colours for the donut slices, taken from the brand palette in index.css.
const COLORS = ['var(--color-brand-900)', 'var(--color-brand-600)', 'var(--color-gold-500)', 'var(--color-brand-400)', 'var(--color-gold-300)', 'var(--color-brand-700)', 'var(--color-brand-200)']

// Bar chart of decisions per year, with a gold line for the running total.
// It is drawn with SVG: x() works out where each year sits, and each bar's height is its share of the biggest bar.
export function TrendChart({ data }: { data: Count[] }) {
  const w = 640, h = 240, pad = { l: 40, r: 40, t: 12, b: 28 }
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b
  const maxBar = Math.max(...data.map((d) => d.count))
  let run = 0
  const cumulative = data.map((d) => (run += d.count))
  const total = run
  const bw = iw / data.length
  const x = (i: number) => pad.l + bw * i + bw / 2
  const line = cumulative.map((c, i) => `${i ? 'L' : 'M'}${x(i)},${pad.t + ih - (c / total) * ih}`).join(' ')
  const step = Math.ceil(data.length / 8)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="AI device decisions per year with cumulative total" className="h-auto w-full">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih * (1 - t)} y2={pad.t + ih * (1 - t)} stroke="var(--color-brand-100)" />
          <text x={pad.l - 6} y={pad.t + ih * (1 - t) + 3} textAnchor="end" fontSize="10" fill="var(--color-brand-600)">{Math.round(maxBar * t)}</text>
          <text x={w - pad.r + 6} y={pad.t + ih * (1 - t) + 3} fontSize="10" fill="var(--color-gold-700)">{fmt.format(Math.round(total * t))}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <rect key={d.label} x={x(i) - bw * 0.35} width={bw * 0.7} y={pad.t + ih - (d.count / maxBar) * ih} height={(d.count / maxBar) * ih} rx={2} fill="var(--color-brand-600)">
          <title>{`${d.label}: ${d.count} decisions`}</title>
        </rect>
      ))}
      <path d={line} fill="none" stroke="var(--color-gold-700)" strokeWidth={2} />
      {data.map((d, i) => i % step === 0 && <text key={d.label} x={x(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--color-brand-600)">{d.label}</text>)}
    </svg>
  )
}

// A donut chart. Each slice is a circle outline, cut to length with strokeDasharray (the dash length is the slice's share).
export function Donut({ items }: { items: Count[] }) {
  const total = items.reduce((s, i) => s + i.count, 0)
  const r = 54, c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 140 140" className="size-36 shrink-0 -rotate-90" role="img" aria-label="Share of AI devices by specialty">
        {items.map((item, i) => {
          const len = (item.count / total) * c
          const el = (
            <circle key={item.label} cx={70} cy={70} r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={22} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}>
              <title>{`${item.label}: ${item.count}`}</title>
            </circle>
          )
          offset += len
          return el
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-xs">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="truncate text-brand-700">{item.label}</span></span>
            <span className="font-bold text-brand-700">{Math.round((item.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
