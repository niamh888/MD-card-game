import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SignIn from './SignIn'

// Replace the real fetch with a fake one so the test never needs the Flask backend.
function fakeBackend(ok: boolean, body: object) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }))
}

function renderPage() {
  // MemoryRouter gives the page a router to work with (it contains a <Link>).
  return render(
    <MemoryRouter>
      <SignIn />
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('SignIn page', () => {
  it('asks for an email address', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /sign in to save your progress/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
  })

  it('tells the person to check their email after asking for a link', async () => {
    fakeBackend(true, { sent: true })
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'learner@example.com')
    await userEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })

  it('shows the error the backend sends back', async () => {
    fakeBackend(false, { error: 'Please enter a valid email address.' })
    renderPage()
    await userEvent.type(screen.getByLabelText(/email address/i), 'learner@example.com')
    await userEvent.click(screen.getByRole('button', { name: /email me a sign-in link/i }))
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument()
  })
})
