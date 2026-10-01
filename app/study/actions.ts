'use server'

import { auth } from '@/auth'
import { pool } from '@/lib/db'

export async function saveRating(term: string, rating: number) {
  if (![1, 2, 3].includes(rating) || !term) return { saved: false }
  const session = await auth()
  if (!session?.user?.id) return { saved: false }
  await pool.query(
    `INSERT INTO card_ratings (user_id, card_term, rating) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, card_term) DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()`,
    [Number(session.user.id), term, rating],
  )
  return { saved: true }
}
