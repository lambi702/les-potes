import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const NAV_ITEMS = [
  { to: '/', label: 'QG', icon: '🏠' },
  { to: '/events', label: 'Calendrier', icon: '📅' },
  { to: '/loans', label: 'Troc', icon: '🎒' },
  { to: '/journal', label: 'Ragots', icon: '👀' },
  { to: '/feedback', label: 'Feedback', icon: '🧪' },
]

function formatNextDate(iso) {
  return new Date(iso + 'Z').toLocaleString('fr-BE', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function useNextEvent() {
  const [nextEvent, setNextEvent] = useState(null)
  useEffect(() => {
    api.listEvents()
      .then((events) => {
        const upcoming = events
          .filter((e) => new Date(e.starts_at + 'Z').getTime() >= Date.now())
          .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
        setNextEvent(upcoming[0] || null)
      })
      .catch(() => setNextEvent(null))
  }, [])
  return nextEvent
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nextEvent = useNextEvent()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-potes-panel border-b-4 border-black sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <span className="text-2xl flex-shrink-0">🏛️</span>
              <span className="arcade-title text-potes-gold text-xs sm:text-base truncate">LES POTES</span>
            </div>
            {user && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <NavLink to={`/participant/${user.id}`} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 hover:bg-white/10">
                  <span className="text-lg">{user.avatar_emoji}</span>
                  <span className="hidden sm:inline font-display font-semibold text-sm">{user.display_name}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="text-sm font-display text-white/60 hover:text-white px-2 py-1"
                >
                  ↪
                </button>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `font-display font-bold text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition flex-shrink-0 ${
                    isActive ? 'bg-potes-red text-white pixel-border' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `font-display font-bold text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition flex-shrink-0 ${
                    isActive ? 'bg-potes-flame text-white pixel-border' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`
                }
              >
                🛠️ Staff
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {nextEvent && (
        <NavLink
          to="/events"
          className="block bg-potes-red/90 hover:bg-potes-red text-center text-xs sm:text-sm font-display font-bold py-1.5 tracking-wide px-4 truncate"
        >
          📅 Prochain rendez-vous : {nextEvent.title} — {formatNextDate(nextEvent.starts_at)}
        </NavLink>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>

      <footer className="text-center text-white/30 text-xs py-4 font-display">
        Les Potes — fait avec 🔥 (et un peu de peket)
      </footer>
    </div>
  )
}
