'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Flame,
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
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e6ede8" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#2d7459"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
        />
      </svg>
      <span className="text-sm font-bold text-[#1e3d32]">{value}%</span>
    </div>
  )
}

export default function Page() {
  const [current, setCurrent] = useState(0)
  const [selectedArea, setSelectedArea] = useState('All areas')
  const [selectedRole, setSelectedRole] = useState('All roles')
  const [revealed, setRevealed] = useState(false)
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [completed, setCompleted] = useState(12)
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
  const progress = useMemo(() => Math.round((completed / 20) * 100), [completed])

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
    if (completed < 20) setCompleted((count) => count + 1)
  }

  return (
    <main className="min-h-screen bg-[#f4f8f5] text-[#18352c]">
      <header className="border-b border-[#dfe9e2] bg-[#f8fbf9]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#245f49] text-white shadow-sm">
              <Sparkles size={19} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[17px] font-bold tracking-[-0.03em] text-[#17382c]">RAPS <span className="font-normal text-[#88a294]">/</span> Card Game</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#81998c]">Medical device learning</div>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-[#658074] md:flex">
            <a className="text-[#245f49]" href="#study">Study deck</a>
            <a href="#progress">My progress</a>
            <button className="flex items-center gap-2 rounded-full border border-[#d9e6dc] bg-white px-3 py-2 text-[#345f4f] shadow-sm" type="button">
              <div className="flex size-6 items-center justify-center rounded-full bg-[#e3f0e8] text-[10px] font-bold text-[#2e6e55]">AR</div>
              Alex Rivera <ChevronDown size={14} />
            </button>
          </div>
          <button className="rounded-full border border-[#d9e6dc] bg-white p-2 text-[#496f60] md:hidden" aria-label="Open profile menu" type="button"><ChevronDown size={17} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6f9783]">Daily practice · Set 04</p>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#17382c] sm:text-[40px]">Sharpen your recall.</h1>
            <p className="mt-2 max-w-lg text-[15px] leading-6 text-[#70897c]">Name the definition before you flip the card. Your first instinct is part of the practice.</p>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-[#dfeae1] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(42,83,63,0.05)]">
            <div className="flex items-center gap-2 border-r border-[#e6ede8] pr-5"><Flame size={17} className="text-[#d88748]" /><div><p className="text-[11px] font-medium text-[#8aa095]">Streak</p><p className="text-sm font-bold text-[#325e4d]">4 days</p></div></div>
            <div className="flex items-center gap-2"><Trophy size={17} className="text-[#c38b36]" /><div><p className="text-[11px] font-medium text-[#8aa095]">Best score</p><p className="text-sm font-bold text-[#325e4d]">86%</p></div></div>
          </div>
        </div>

        <section aria-labelledby="area-heading" className="mb-6 rounded-[20px] border border-[#dce9df] bg-white p-4 shadow-[0_8px_24px_rgba(42,83,63,0.04)] sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f9783]">Choose your focus</p>
              <h2 id="area-heading" className="mt-1 text-base font-bold text-[#294e40]">Medical device areas</h2>
            </div>
            <p className="text-xs text-[#8ba096]">Filter the deck by topic</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Medical device study areas">
            {studyAreas.map((area) => (
              <button key={area} type="button" onClick={() => selectArea(area)} aria-pressed={selectedArea === area} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${selectedArea === area ? 'border-[#2d7459] bg-[#2d7459] text-white shadow-sm' : 'border-[#dce9df] bg-[#fbfdfb] text-[#668376] hover:border-[#8fc1a3] hover:text-[#2d7459]'}`}>
                {area}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="role-heading" className="mb-6 rounded-[20px] border border-[#dce9df] bg-[#f0f7f2] p-4 shadow-[0_8px_24px_rgba(42,83,63,0.03)] sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f9783]">Make it relevant</p>
              <h2 id="role-heading" className="mt-1 text-base font-bold text-[#294e40]">Choose your role</h2>
            </div>
            <p className="text-xs text-[#789086]">Practice questions for your day-to-day responsibilities</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Professional roles">
            {roles.map((role) => (
              <button key={role} type="button" onClick={() => selectRole(role)} aria-pressed={selectedRole === role} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${selectedRole === role ? 'border-[#2d7459] bg-[#2d7459] text-white shadow-sm' : 'border-[#d4e5d9] bg-white text-[#668376] hover:border-[#8fc1a3] hover:text-[#2d7459]'}`}>
                {role}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section id="study" className="rounded-[24px] border border-[#dce9df] bg-white p-4 shadow-[0_12px_36px_rgba(43,84,63,0.07)] sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="rounded-full bg-[#e8f3ec] px-3 py-1.5 text-xs font-bold text-[#39745b]">CARD {String(current + 1).padStart(2, '0')} / {studyCards.length}</span><span className="text-xs text-[#9aada3]">{card.category}</span></div>
              <button aria-label="Restart deck" className="rounded-full p-2 text-[#8da49a] transition-colors hover:bg-[#f1f7f3] hover:text-[#39745b]" type="button" onClick={() => { setCurrent(0); setCompleted(0); setRevealed(false); setRating(null); }}><RotateCcw size={17} /></button>
            </div>
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#edf3ee]"><div className="h-full rounded-full bg-[#4f9274] transition-all" style={{ width: `${Math.max(8, (current + 1) * 5)}%` }} /></div>

            <div className="relative min-h-[355px] overflow-hidden rounded-[18px] border border-[#dce9df] bg-[#fbfdfb]">
              <div className="absolute left-0 top-0 h-1 w-full bg-[#dcefe2]" />
              <div className="flex min-h-[355px] flex-col items-center justify-center px-6 py-10 text-center">
                {!revealed ? <>
                  <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#eaf4ed] text-[#39745b]"><CircleHelp size={23} /></span>
                  <span className="mb-3 text-xs font-bold uppercase tracking-[0.19em] text-[#88a094]">Define this term</span>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#1d4436] sm:text-[42px]">{card.term}</h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-[#789086]">Say your answer out loud or write a few words below, then reveal the definition.</p>
                  <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Your definition (optional)" className="mt-6 min-h-20 w-full max-w-md resize-none rounded-xl border border-[#d9e7dd] bg-white px-4 py-3 text-sm text-[#315747] outline-none placeholder:text-[#a9b9b0] focus:border-[#5b9a7c] focus:ring-2 focus:ring-[#dcefe3]" aria-label="Your definition" />
                </> : <>
                  <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#e5f2e9] text-[#2d7459]"><Check size={23} strokeWidth={2.5} /></span>
                  <span className="mb-3 text-xs font-bold uppercase tracking-[0.19em] text-[#88a094]">Definition revealed</span>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#1d4436] sm:text-[38px]">{card.term}</h2>
                  <div className="mt-6 max-w-xl rounded-xl bg-[#f0f7f2] px-5 py-4 text-left"><p className="text-[15px] leading-7 text-[#416656]">{card.definition}</p></div>
                </>}
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] font-medium text-[#a0b1a8]">{revealed ? 'Compare your answer with the definition' : 'Take a moment to think before revealing'}</div>
            </div>

            {!revealed ? <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={() => setRevealed(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#276b51] px-7 text-sm font-bold text-white shadow-[0_5px_12px_rgba(39,107,81,0.18)] transition hover:bg-[#1e5d45] sm:w-auto">Reveal definition <ArrowRight size={17} /></button><p className="text-xs text-[#96a89f]">Press <kbd className="rounded border border-[#dce8df] bg-white px-1.5 py-0.5 font-sans">Space</kbd> to reveal</p></div> : <div className="mt-5"><p className="mb-3 text-center text-xs font-semibold text-[#769084]">How close was your answer?</p><div className="grid grid-cols-3 gap-2"><button onClick={() => rate(1)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 1 ? 'border-[#dfb079] bg-[#fff4e7] text-[#a86627]' : 'border-[#e5e9e6] bg-white text-[#7d9187] hover:border-[#dfb079]'}`}>Needs review</button><button onClick={() => rate(2)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 2 ? 'border-[#8fc1a3] bg-[#eff8f1] text-[#39805b]' : 'border-[#e5e9e6] bg-white text-[#7d9187] hover:border-[#8fc1a3]'}`}>Getting there</button><button onClick={() => rate(3)} type="button" className={`rounded-xl border py-3 text-xs font-bold transition ${rating === 3 ? 'border-[#5a9d7d] bg-[#e5f3e9] text-[#276b51]' : 'border-[#e5e9e6] bg-white text-[#7d9187] hover:border-[#8fc1a3]'}`}>I knew it</button></div></div>}
            <div className="mt-7 flex items-center justify-between border-t border-[#edf1ee] pt-5"><button type="button" onClick={() => setCurrent((current - 1 + cards.length) % cards.length)} className="flex items-center gap-2 text-xs font-bold text-[#729084] hover:text-[#2b6a50]"><ArrowLeft size={15} /> Previous</button><button type="button" onClick={nextCard} className="flex items-center gap-2 text-xs font-bold text-[#2b6a50] hover:text-[#174e39]">Next card <ArrowRight size={15} /></button></div>
          </section>

          <aside id="progress" className="space-y-5">
            <div className="rounded-[20px] border border-[#dce9df] bg-white p-5 shadow-[0_8px_24px_rgba(42,83,63,0.04)]"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-bold text-[#294e40]">Today&apos;s progress</h2><span className="text-xs font-semibold text-[#6c8c7b]">{completed} / 20 cards</span></div><div className="flex items-center gap-4"><ProgressRing value={progress} /><div><p className="text-sm font-semibold text-[#315b4a]">Keep it going</p><p className="mt-1 text-xs leading-5 text-[#8ba096]">8 more cards to complete today&apos;s set.</p></div></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#edf2ee] pt-4 text-center"><div><p className="text-lg font-bold text-[#2c694f]">86%</p><p className="text-[10px] uppercase tracking-wider text-[#9aaca3]">Accuracy</p></div><div><p className="text-lg font-bold text-[#2c694f]">12</p><p className="text-[10px] uppercase tracking-wider text-[#9aaca3]">Reviewed</p></div><div><p className="text-lg font-bold text-[#2c694f]">4</p><p className="text-[10px] uppercase tracking-wider text-[#9aaca3]">Streak</p></div></div></div>
            <div className="rounded-[20px] border border-[#dce9df] bg-[#edf6ef] p-5"><div className="mb-3 flex items-center gap-2 text-[#4e866a]"><Timer size={17} /><span className="text-xs font-bold uppercase tracking-[0.15em]">Study tip</span></div><p className="text-sm leading-6 text-[#4a695b]">Try to explain the term in your own words before checking the card. Retrieval makes it stick.</p><div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#347152]"><Sparkles size={14} /> Active recall mode</div></div>
            <div className="rounded-[20px] border border-[#dce9df] bg-white p-5"><h2 className="mb-4 text-sm font-bold text-[#294e40]">Decks</h2><div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#45685a]">Medical devices</p><p className="text-[11px] text-[#9aaba3]">48 cards</p></div><span className="rounded-full bg-[#eaf4ed] px-2 py-1 text-[10px] font-bold text-[#4c896b]">Current</span></div><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#789087]">Clinical foundations</p><p className="text-[11px] text-[#a8b6af]">32 cards</p></div><span className="text-[11px] font-medium text-[#9aaba3]">Locked</span></div></div></div>
          </aside>
        </div>
      </div>
    </main>
  )
}
