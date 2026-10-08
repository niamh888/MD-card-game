import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'

export const metadata = { title: 'Sign in | Medical Device Learning' }

async function requestLink(formData: FormData) {
  'use server'
  await signIn('resend', { email: String(formData.get('email') ?? ''), redirectTo: '/study' })
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams
  const session = await auth().catch(() => null)
  if (session?.user) redirect('/study')

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-5 text-brand-900">
      <div className="w-full max-w-sm rounded-[20px] border border-brand-200 bg-white p-6 shadow-[0_8px_24px_rgba(26,26,46,0.05)]">
        <h1 className="text-xl font-semibold tracking-[-0.03em]">Sign in to save your progress</h1>
        {sent ? (
          <p className="mt-3 text-sm leading-6 text-brand-700">Check your email. We have sent you a link to sign in. You can close this tab.</p>
        ) : (
          <form action={requestLink} className="mt-4 space-y-3">
            <p className="text-sm leading-6 text-brand-700">Enter your email and we will send you a sign-in link. No password needed.</p>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" className="w-full rounded-xl border border-brand-300 px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
            {error && <p className="text-xs text-red-700">Sign-in failed. Please try again.</p>}
            <button type="submit" className="w-full rounded-xl bg-brand-900 py-3 text-sm font-bold text-white">Email me a sign-in link</button>
          </form>
        )}
        <a href="/study" className="mt-4 block text-center text-xs font-medium text-brand-600 hover:underline">Continue without signing in</a>
      </div>
    </main>
  )
}
