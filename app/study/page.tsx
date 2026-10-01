import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { auth, signOut } from '@/auth'
import { pool } from '@/lib/db'
import StudyClient from '@/components/study/study-client'

export const dynamic = 'force-dynamic'

async function getUser() {
  try {
    const session = await auth()
    return session?.user?.id ? { id: Number(session.user.id), email: session.user.email ?? '' } : null
  } catch {
    return null
  }
}

async function getRatings(userId: number): Promise<Record<string, number>> {
  try {
    const { rows } = await pool.query('SELECT card_term, rating FROM card_ratings WHERE user_id = $1', [userId])
    return Object.fromEntries(rows.map((r) => [r.card_term, r.rating]))
  } catch {
    return {}
  }
}

export default async function StudyPage() {
  const user = await getUser()
  const initialRatings = user ? await getRatings(user.id) : {}

  const account = user ? (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
      className="flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-2 text-brand-700 shadow-sm"
    >
      <span className="max-w-[160px] truncate">{user.email}</span>
      <button type="submit" className="font-bold text-gold-700 hover:underline">Sign out</button>
    </form>
  ) : (
    <Link href="/signin" className="flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-white shadow-sm">
      Sign in <ChevronDown size={14} className="-rotate-90" />
    </Link>
  )

  return <StudyClient account={account} signedIn={!!user} initialRatings={initialRatings} />
}
