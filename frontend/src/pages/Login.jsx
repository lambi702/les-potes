import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏛️</div>
          <h1 className="arcade-title text-potes-gold text-lg leading-relaxed">LES POTES</h1>
          <p className="text-white/50 text-sm mt-2 font-display">La bande, au quotidien, en un seul endroit</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-display font-bold text-white/70 mb-1">Pseudo</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ton pseudo"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-white/70 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-potes-flame text-sm font-display font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-potes-red hover:brightness-110 disabled:opacity-50 text-white font-display font-bold py-2.5 rounded-lg pixel-border transition"
          >
            {loading ? 'Connexion...' : "C'est parti 🚀"}
          </button>
          <p className="text-white/40 text-xs text-center font-display">
            Pas encore de compte ? <Link to="/join" className="text-potes-green font-bold">Inscris-toi</Link> avec le code d'invitation.
          </p>
        </form>
      </div>
    </div>
  )
}
