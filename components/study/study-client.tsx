'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { saveRating } from '@/app/study/actions'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react'

const cards = [
  {
    term: 'Aseptic technique',
    category: 'Sterilisation',
    definition:
      'A set of practices used to prevent the introduction and spread of microorganisms during a clinical procedure.',
    hint: 'Think about reducing contamination risk during a procedure.',
  },
  {
    term: 'Hemostasis',
    category: 'Clinical fundamentals',
    definition: 'The process of stopping bleeding through vessel constriction, platelet activity, and clot formation.',
    hint: 'It is the body’s response to stop blood loss.',
  },
  {
    term: 'Biocompatibility',
    category: 'Medical devices',
    definition: 'The ability of a material or device to perform safely without causing an unacceptable reaction in the body.',
    hint: 'Consider how a device interacts with living tissue.',
  },
  {
    term: 'Radiopaque',
    category: 'Imaging',
    definition: 'A material or structure that blocks X-rays and appears white or light on a radiographic image.',
    hint: 'The opposite of radiolucent on an X-ray.',
  },
  {
    term: 'AI-enabled medical device',
    category: 'AI-enabled medical devices',
    definition: 'A medical device that uses artificial intelligence or machine learning to support diagnosis, monitoring, prediction, or treatment while remaining subject to medical device requirements.',
    hint: 'Consider the intended purpose, model behaviour, and how performance is controlled across the device lifecycle.',
  },
  {
    term: 'Good machine learning practice',
    category: 'AI-enabled medical devices',
    definition: 'A disciplined set of practices for data management, model development, validation, deployment, monitoring, and change control that supports safe and effective AI-enabled medical devices.',
    hint: 'Think beyond the algorithm: data quality, human factors, validation, and lifecycle monitoring all matter.',
  },
]

const studyAreas = ['All areas', 'Biocompatibility', 'Sterilisation', 'SaMD', 'SiMD', 'AI-enabled medical devices', 'Electrical Safety', 'Risk Management', 'QMS']
const roles = ['All roles', 'Regulatory Affairs', 'Quality Assurance', 'Supplier Quality', 'Manufacturing / Process', 'R&D Engineering', 'Document Control', 'Clinical Affairs']

const roleCards = [
  { term: 'Substantial change', role: 'Regulatory Affairs', category: 'Regulatory Affairs', definition: 'A change that may significantly affect the safety or effectiveness of a device and may require regulatory authority notification or approval.', hint: 'Consider the change impact, intended use, and applicable market pathway.' },
  { term: 'CAPA effectiveness', role: 'Quality Assurance', category: 'Quality Assurance', definition: 'Objective evidence that corrective and preventive actions addressed the root cause and prevented recurrence.', hint: 'It is more than simply completing the action.' },
  { term: 'Supplier corrective action', role: 'Supplier Quality', category: 'Supplier Quality', definition: 'A formal request for a supplier to investigate a nonconformance, identify its root cause, and implement verified corrective action.', hint: 'Think about supplier accountability and evidence.' },
  { term: 'Process validation', role: 'Manufacturing / Process', category: 'Manufacturing / Process', definition: 'Documented evidence that a process consistently produces an outcome meeting predetermined requirements.', hint: 'The result cannot be fully verified by inspection alone.' },
  { term: 'Design transfer', role: 'R&D Engineering', category: 'R&D Engineering', definition: 'The controlled process of translating design outputs into manufacturing specifications and instructions.', hint: 'It bridges development and production.' },
  { term: 'Document change order', role: 'Document Control', category: 'Document Control', definition: 'A controlled record used to review, approve, release, and track changes to quality system documents.', hint: 'Focus on revision history and approval status.' },
  { term: 'Clinical evaluation', role: 'Clinical Affairs', category: 'Clinical Affairs', definition: 'The systematic process of assessing clinical data to demonstrate that a device achieves its intended clinical benefit and meets safety requirements.', hint: 'It connects clinical evidence with intended purpose.' },
]

function ProgressRing({ value }: { value: number }) {
  const radius = 27
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative flex size-16 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-brand-200)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--color-brand-700)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
        />
      </svg>
      <span className="text-sm font-bold text-brand-900">{value}%</span>
    </div>
  )
}

const allCards = [...cards, ...roleCards]
const totalCards = allCards.length

export default function StudyClient({ account, signedIn, initialRatings }: { account: ReactNode; signedIn: boolean; initialRatings: Record<string, number> }) {
  const [current, setCurrent] = useState(0)
  const [selectedArea, setSelectedArea] = useState('All areas')
  const [selectedRole, setSelectedRole] = useState('All roles')
  const [revealed, setRevealed] = useState(false)
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>(initialRatings)
  const filteredCards = useMemo(() => {
    const roleDeck = selectedRole === 'All roles' ? cards : roleCards.filter((item) => item.role === selectedRole)
    return selectedArea === 'All areas' ? roleDeck : roleDeck.filter((item) => item.category === selectedArea)
  }, [selectedArea, selectedRole])
  const studyCards = filteredCards.length > 0 ? filteredCards : [{
    term: 'New cards coming soon',
    category: selectedArea,
    definition: `The ${selectedArea} deck is being prepared. Choose All areas or another topic to keep studying for now.`,
    hint: 'This topic will be added to the deck soon.',
  }]
  const card = studyCards[current] ?? studyCards[0]
  const ratedCount = allCards.filter((item) => ratings[item.term]).length
  const knewCount = allCards.filter((item) => ratings[item.term] === 3).length
  const needsReview = allCards.filter((item) => ratings[item.term] === 1).length
  const progress = Math.round((ratedCount / totalCards) * 100)
  const accuracy = ratedCount === 0 ? 0 : Math.round((knewCount / ratedCount) * 100)

  function resetCard() {
    setCurrent(0)
    setRevealed(false)
    setAnswer('')
    setRating(null)
  }

  function selectArea(area: string) {
    setSelectedArea(area)
    resetCard()
  }

  function selectRole(role: string) {
    setSelectedRole(role)
    resetCard()
  }

  function nextCard() {
    setCurrent((current + 1) % studyCards.length)
    setRevealed(false)
    setAnswer('')
    setRating(null)
  }

  function rate(value: number) {
    setRating(value)
    if (!allCards.some((item) => item.term === card.term)) return
    setRatings((previous) => ({ ...previous, [card.term]: value }))
    if (signedIn) void saveRating(card.term, value)
  }

  return (
    <main className="min-h-screen bg-brand-100 text-brand-900">
      <header className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-900 text-gold-300 shadow-sm">
              <Sparkles size={19} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-[-0.03em] text-brand-900">RAPS <span className="font-normal text-brand-600">/</span> Card Game</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-600">Medical device learning</div>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-brand-600 md:flex">
            <a href="/">Dashboard</a><a className="text-brand-800" href="#study">Study deck</a>
            <a href="#progress">My progress</a>
            {account}
          </div>
          <div className="text-sm font-medium md:hidden">{account}</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Daily practice</p>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-brand-900 sm:text-[40px]">Sharpen your recall.</h1>
            <p className="mt-2 max-w-lg text-[15px] leading-6 text-brand-600">Name the definition before you flip the card. Your first instinct is part of the practice.</p>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(26,26,46,0.05)]">
            <div className="flex items-center gap-2 border-r border-brand-200 pr-5"><Check size={17} className="text-gold-500" /><div><p className="text-[11px] font-medium text-brand-600">Cards rated</p><p className="text-sm font-bold text-brand-700">{ratedCount} / {totalCards}</p></div></div>
            <div className="flex items-center gap-2"><Trophy size={17} className="text-gold-700" /><div><p className="text-[11px] font-medium text-brand-600">Knew it</p><p className="text-sm font-bold text-brand-700">{knewCount}</p></div></div>
          </div>
        </div>

        <section aria-labelledby="area-heading" className="mb-6 rounded-[20px] border border-brand-200 bg-white p-4 shadow-[0_8px_24px_rgba(26,26,46,0.04)] sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Choose your focus</p>
              <h2 id="area-heading" className="mt-1 text-base font-bold text-brand-800">Medical device areas</h2>
            </div>
            <p className="text-xs text-brand-600">Filter the deck by topic</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Medical device study areas">
            {studyAreas.map((area) => (
              <button key={area} type="button" onClick={() => selectArea(area)} aria-pressed={selectedArea === area} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${selectedArea === area ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-brand-200 bg-brand-50 text-brand-600 hover:border-brand-600 hover:text-brand-700'}`}>
                {area}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="role-heading" className="mb-6 rounded-[20px] border border-brand-200 bg-brand-100 p-4 shadow-[0_8px_24px_rgba(26,26,46,0.03)] sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Make it relevant</p>
              <h2 id="role-heading" className="mt-1 text-base font-bold text-brand-800">Choose your role</h2>
            </div>
            <p className="text-xs text-brand-600">Practice questions for your day-to-day responsibilities</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Professional roles">
            {roles.map((role) => (
              <button key={role} type="button" onClick={() => selectRole(role)} aria-pressed={selectedRole === role} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${selectedRole === role ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-brand-300 bg-white text-brand-600 hover:border-brand-600 hover:text-brand-700'}`}>
                {role}
              </button>
            ))}
          </div>
        </section>

        {!signedIn && (
          <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-gold-300 bg-gold-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-brand-800">Your ratings are not being saved. Sign in with your email to keep your progress.</p>
            <a href="/signin" className="w-fit rounded-full bg-brand-900 px-4 py-2 text-xs font-bold text-white">Sign in</a>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section id="study" className="rounded-[24px] border border-brand-200 bg-white p-4 shadow-[0_12px_36px_rgba(26,26,46,0.07)] sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="rounded-full bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-700">CARD {String(current + 1).padStart(2, '0')} / {studyCards.length}</span><span className="text-xs text-brand-600">{card.category}</span></div>
              <button aria-label="Restart deck" className="rounded-full p-2 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-700" type="button" onClick={() => { setCurrent(0); setRevealed(false); setRating(null); }}><RotateCcw size={17} /></button>
            </div>
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${((current + 1) / studyCards.length) * 100}%` }} /></div>

            <div className="relative min-h-[355px] overflow-hidden rounded-[18px] border border-brand-200 bg-brand-50">
              <div className="absolute left-0 top-0 h-1 w-full bg-brand-200" />
              <div className="flex min-h-[355px] flex-col items-center justify-center px-6 py-10 text-center">
                {!revealed ? <>
                  <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><CircleHelp size={23} /></span>
                  <span className="mb-3 text-xs font-bold uppercase tracking-[0.19em] text-brand-600">Define this term</span>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-[42px]">{card.term}</h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-brand-600">Say your answer out loud or write a few words below, then reveal the definition.</p>
                  <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Your definition (optional)" className="mt-6 min-h-20 w-full max-w-md resize-none rounded-xl border border-brand-300 bg-white px-4 py-3 text-sm text-brand-800 outline-none placeholder:text-brand-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200" aria-label="Your definition" />
                </> : <>
                  <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-brand-200 text-brand-700"><Check size={23} strokeWidth={2.5} /></span>
                  <span className="mb-3 text-xs font-bold uppercase tracking-[0.19em] text-brand-600">Definition revealed</span>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-[38px]">{card.term}</h2>
                  <div className="mt-6 max-w-xl rounded-xl bg-brand-100 px-5 py-4 text-left"><p className="text-[15px] leading-7 text-brand-700">{card.definition}</p></div>
                </>}
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] font-medium text-brand-600">{revealed ? 'Compare your answer with the definition' : 'Take a moment to think before revealing'}</div>
            </div>

            {!revealed ? <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={() => setRevealed(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-7 text-sm font-bold text-white shadow-[0_5px_12px_rgba(26,26,46,0.18)] transition hover:bg-brand-800 sm:w-auto">Reveal definition <ArrowRight size={17} /></button></div> : <div className="mt-5"><p className="mb-3 text-center text-xs font-semibold text-brand-600">How close was your answer?</p><div className="grid grid-cols-3 gap-2"><button onClick={() => rate(1)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 1 ? 'border-gold-500 bg-gold-100 text-gold-700' : 'border-brand-200 bg-white text-brand-600 hover:border-gold-500'}`}>Needs review</button><button onClick={() => rate(2)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 2 ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-brand-200 bg-white text-brand-600 hover:border-brand-600'}`}>Getting there</button><button onClick={() => rate(3)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 3 ? 'border-brand-600 bg-brand-200 text-brand-700' : 'border-brand-200 bg-white text-brand-600 hover:border-brand-600'}`}>I knew it</button></div></div>}
            <div className="mt-7 flex items-center justify-between border-t border-brand-100 pt-5"><button type="button" onClick={() => setCurrent((current - 1 + studyCards.length) % studyCards.length)} className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700"><ArrowLeft size={15} /> Previous</button><button type="button" onClick={nextCard} className="flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-800">Next card <ArrowRight size={15} /></button></div>
          </section>

          <aside id="progress" className="space-y-5">
            <div className="rounded-[20px] border border-brand-200 bg-white p-5 shadow-[0_8px_24px_rgba(26,26,46,0.04)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-bold text-brand-800">Your progress</h2><span className="text-xs font-semibold text-brand-600">{ratedCount} / {totalCards} cards</span></div><div className="flex items-center gap-4"><ProgressRing value={progress} /><div><p className="text-sm font-semibold text-brand-800">{signedIn ? (ratedCount === 0 ? 'Rate a card to begin' : 'Progress saved') : 'Not saved yet'}</p><p className="mt-1 text-xs leading-5 text-brand-600">{signedIn ? `${totalCards - ratedCount} cards still to rate.` : 'Sign in to keep your progress.'}</p></div></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-brand-100 pt-4 text-center"><div><p className="text-lg font-bold text-brand-700">{accuracy}%</p><p className="text-[10px] uppercase tracking-wider text-brand-600">Knew it</p></div><div><p className="text-lg font-bold text-brand-700">{ratedCount}</p><p className="text-[10px] uppercase tracking-wider text-brand-600">Rated</p></div><div><p className="text-lg font-bold text-brand-700">{needsReview}</p><p className="text-[10px] uppercase tracking-wider text-brand-600">To review</p></div></div></div>
            <div className="rounded-[20px] border border-brand-200 bg-brand-100 p-5"><div className="mb-3 flex items-center gap-2 text-brand-700"><Timer size={17} /><span className="text-xs font-bold uppercase tracking-[0.15em]">Study tip</span></div><p className="text-sm leading-6 text-brand-700">Try to explain the term in your own words before checking the card. Retrieval makes it stick.</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-700"><Sparkles size={14} /> Active recall mode</div></div>
            <div className="rounded-[20px] border border-brand-200 bg-white p-5"><h2 className="mb-4 text-sm font-bold text-brand-800">Decks</h2><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-brand-700">Medical devices</p><p className="text-[11px] text-brand-600">{totalCards} cards</p></div><span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-bold text-brand-700">Current</span></div></div>
          </aside>
        </div>
      </div>
    </main>
  )
}
