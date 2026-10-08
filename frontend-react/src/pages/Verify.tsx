import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyToken } from '@/lib/api'

// The emailed link points here: /auth/verify?token=...
// We hand the token to Flask, which signs the person in, then go to the study deck.
export default function Verify() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setError('This sign-in link is invalid.')
      return
    }
    verifyToken(token)
      .then(() => navigate('/study', { replace: true }))
      .catch((e: Error) => setError(e.message))
  }, [params, navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-5 text-brand-900">
      <div className="w-full max-w-sm rounded-[20px] border border-brand-200 bg-white p-6 text-center">
        {error ? (
          <>
            <p className="text-sm text-red-700">{error}</p>
            <Link to="/signin" className="mt-4 inline-block text-sm font-bold text-gold-700 hover:underline">Request a new link</Link>
          </>
        ) : (
          <p className="text-sm text-brand-700">Signing you in...</p>
        )}
      </div>
    </main>
  )
}
