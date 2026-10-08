import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestLink } from '@/lib/api'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault() // stop the browser reloading the page
    setBusy(true)
    setError('')
    try {
      await requestLink(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-5 text-brand-900">
      <div className="w-full max-w-sm rounded-[20px] border border-brand-200 bg-white p-6 shadow-[0_8px_24px_rgba(26,26,46,0.05)]">
        <h1 className="text-xl font-semibold tracking-[-0.03em]">Sign in to save your progress</h1>
        {sent ? (
          <p className="mt-3 text-sm leading-6 text-brand-700">Check your email. We have sent you a link to sign in. You can close this tab.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <p className="text-sm leading-6 text-brand-700">Enter your email and we will send you a sign-in link. No password needed.</p>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-brand-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
            {error && <p className="text-xs text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-900 py-3 text-sm font-bold text-white disabled:opacity-60">
              {busy ? 'Sending...' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
        <Link to="/study" className="mt-4 block text-center text-xs font-medium text-brand-600 hover:underline">Continue without signing in</Link>
      </div>
    </main>
  )
}
