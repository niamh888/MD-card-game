import { Route, Routes } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import Study from '@/pages/Study'
import SignIn from '@/pages/SignIn'
import Verify from '@/pages/Verify'

// The list of pages: which web address shows which page component.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/study" element={<Study />} />
      <Route path="/signin" element={<SignIn />} />
      {/* The page people land on when they click the link in their sign-in email */}
      <Route path="/auth/verify" element={<Verify />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  )
}
