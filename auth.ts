import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import PostgresAdapter from '@auth/pg-adapter'
import { pool } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: PostgresAdapter(pool),
  providers: [Resend({ from: process.env.AUTH_EMAIL_FROM })],
  pages: { signIn: '/signin', verifyRequest: '/signin?sent=1' },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
}))
