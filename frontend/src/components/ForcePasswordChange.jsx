import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ForcePasswordChange() {
  const { refresh } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await api.changePassword({ new_password: password })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="font-display font-extrabold text-lg">Choisis ton mot de passe</h2>
          <p className="text-white/50 text-sm font-display mt-1">
            C'est ta première connexion, on remplace le mot de passe temporaire.
          </p>
        </div>
        <input
          type="password"
          autoFocus
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
        />
        <input
          type="password"
          placeholder="Confirme-le"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
        />
        {error && <p className="text-potes-flame text-sm font-display font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-potes-green hover:brightness-110 disabled:opacity-50 text-potes-bg font-display font-bold py-2.5 rounded-lg pixel-border transition"
        >
          {loading ? '...' : 'Valider'}
        </button>
      </form>
    </div>
  )
}
