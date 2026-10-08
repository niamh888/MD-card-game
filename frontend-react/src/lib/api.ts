import type { DashboardData } from './types'

// All the calls from the React app to the Flask backend live in this one file.

// Send a request to Flask and return its JSON reply. Throws an error if Flask says no.
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin', // send the login cookie along with the request
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Something went wrong.')
  return body as T
}

export const getDashboard = () => request<DashboardData>('/api/dashboard')

// Who is signed in? Resolves to null when nobody is.
export const getMe = () => request<{ user: { email: string } | null }>('/api/me').then((r) => r.user)

// Ask Flask to email a sign-in link.
export const requestLink = (email: string) =>
  request<{ sent: boolean }>('/api/auth/request', { method: 'POST', body: JSON.stringify({ email }) })

// Swap the token from the emailed link for a login cookie.
export const verifyToken = (token: string) =>
  request<{ email: string }>('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) })

export const logout = () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })

// The signed-in person's saved ratings, e.g. { Hemostasis: 3 }.
export const getRatings = () => request<Record<string, number>>('/api/ratings')

// Save one rating: 1 = needs review, 2 = getting there, 3 = I knew it.
export const saveRating = (term: string, rating: number) =>
  request<{ saved: boolean }>('/api/ratings', { method: 'PUT', body: JSON.stringify({ term, rating }) })

// Check the backend is running. Resolves to { status: 'ok' } when Flask is up.
export const health = () => request<{ status: string }>('/api/health')

// The same calls gathered in one object, so a page can write api.health() or api.getDashboard().
// (The separate exports above still work, so existing pages need no changes.)
export const api = { health, getDashboard, getMe, requestLink, verifyToken, logout, getRatings, saveRating }
