import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ForcePasswordChange from './components/ForcePasswordChange'
import Login from './pages/Login'
import Join from './pages/Join'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Loans from './pages/Loans'
import Feedback from './pages/Feedback'
import Journal from './pages/Journal'
import Chat from './pages/Chat'
import Leaderboard from './pages/Leaderboard'
import Carte from './pages/Carte'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/40 font-display">Chargement...</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !user.is_admin) return <Navigate to="/" replace />

  return (
    <Layout>
      {user.must_change_password && <ForcePasswordChange />}
      {children}
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<Join />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/events" element={<Protected><Events /></Protected>} />
      <Route path="/loans" element={<Protected><Loans /></Protected>} />
      <Route path="/feedback" element={<Protected><Feedback /></Protected>} />
      <Route path="/journal" element={<Protected><Journal /></Protected>} />
      <Route path="/chat" element={<Protected><Chat /></Protected>} />
      <Route path="/classement" element={<Protected><Leaderboard /></Protected>} />
      <Route path="/carte" element={<Protected><Carte /></Protected>} />
      <Route path="/participant/:id" element={<Protected><Profile /></Protected>} />
      <Route path="/admin" element={<Protected adminOnly><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
