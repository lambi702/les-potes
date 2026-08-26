import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Join() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup({
        invite_code: inviteCode.trim(),
        username: username.trim(),
        display_name: displayName.trim(),
        password,
      })
      navigate('/', { replace: true })
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
          <h1 className="arcade-title text-potes-gold text-lg leading-relaxed">REJOINS LA BANDE</h1>
          <p className="text-white/50 text-sm mt-2 font-display">Tu deviens officiellement un Bleu 🐣</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-display font-bold text-white/70 mb-1">Code d'invitation</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="donné par un pote déjà inscrit"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-white/70 mb-1">Pseudo (pour te connecter)</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ex: julie"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-white/70 mb-1">Nom affiché</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ex: Julie"
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
            {loading ? 'Inscription...' : "J'embarque 🎉"}
          </button>
          <p className="text-white/40 text-xs text-center font-display">
            Déjà un compte ? <Link to="/login" className="text-potes-green font-bold">Connecte-toi</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
