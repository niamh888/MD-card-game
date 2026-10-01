import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import countries from 'i18n-iso-countries'
import world from 'world-atlas/countries-110m.json'
import type { Topology } from 'topojson-specification'
import type { Count } from '@/lib/fda'

const WIDTH = 960
const HEIGHT = 480
const fmt = new Intl.NumberFormat('en-US')

function shade(t: number) {
  const from = [216, 224, 240]
  const to = [26, 26, 70]
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(',')})`
}

export function WorldMap({ data }: { data: Count[] }) {
  const byNumeric = new Map(data.map((d) => [countries.alpha2ToNumeric(d.label), d]))
  const max = Math.log(Math.max(...data.map((d) => d.count)) + 1)
  const topology = world as unknown as Topology
  const shapes = feature(topology, topology.objects.countries as never) as unknown as GeoJSON.FeatureCollection
  const sphere = { type: 'Sphere' } as never
  const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], sphere)
  const path = geoPath(projection)

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="World map of FDA-registered device listings by country" className="h-auto w-full">
      <path d={path(sphere) ?? ''} fill="var(--color-brand-50)" stroke="var(--color-brand-200)" />
      {shapes.features.map((shape) => {
        const match = byNumeric.get(String(shape.id).padStart(3, '0'))
        const name = (shape.properties as { name?: string } | null)?.name ?? 'Unknown'
        return (
          <path key={`${shape.id}-${name}`} d={path(shape) ?? ''} fill={match ? shade(Math.log(match.count + 1) / max) : 'var(--color-brand-200)'} stroke="#fff" strokeWidth={0.5}>
            <title>{match ? `${name}: ${fmt.format(match.count)} listings` : `${name}: no listings`}</title>
          </path>
        )
      })}
    </svg>
  )
}
