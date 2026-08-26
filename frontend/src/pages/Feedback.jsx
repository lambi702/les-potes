import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug', color: 'bg-potes-flame text-white' },
  { value: 'idee', label: '💡 Idée', color: 'bg-potes-green text-potes-bg' },
  { value: 'autre', label: '💬 Autre', color: 'bg-white/20 text-white' },
]

function categoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[2]
}

function formatDate(iso) {
  return new Date(iso + 'Z').toLocaleString('fr-BE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Feedback() {
  const { user: me } = useAuth()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('bug')
  const [showResolved, setShowResolved] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.listFeedback().then(setItems)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!message.trim()) return
    try {
      await api.createFeedback({ message: message.trim(), category })
      setMessage('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleResolve = async (id) => { await api.toggleResolveFeedback(id); load() }
  const handleDelete = async (id) => { await api.deleteFeedback(id); load() }

  const visible = items.filter((f) => showResolved || f.status !== 'resolved')
  const openCount = items.filter((f) => f.status !== 'resolved').length

  return (
    <div>
      <div className="mb-4">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">FEEDBACK 🧪</h1>
        <p className="text-white/50 font-display text-sm">
          Espace de test (UAT) : bugs, idées, trucs bizarres — balance tout ici, {openCount} truc{openCount !== 1 ? 's' : ''} en attente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-4 mb-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg pixel-border transition ${
                category === c.value ? c.color : 'bg-white/5 text-white/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Décris le bug, l'idée ou le truc chelou que t'as vu sur le site..."
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm focus:outline-none focus:ring-2 focus:ring-potes-red"
        />
        {error && <p className="text-potes-flame text-sm font-display">{error}</p>}
        <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
          Envoyer
        </button>
      </form>

      <label className="flex items-center gap-2 text-sm font-display text-white/50 mb-3 cursor-pointer w-fit">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-potes-red" />
        Afficher les résolus
      </label>

      <div className="space-y-3">
        {visible.map((f) => {
          const cat = categoryMeta(f.category)
          const canManage = me?.is_admin || f.author.id === me?.id
          const resolved = f.status === 'resolved'
          return (
            <div key={f.id} className={`bg-potes-panel pixel-border rounded-xl p-4 ${resolved ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full pixel-border ${cat.color}`}>{cat.label}</span>
                  {resolved && (
                    <span className="text-[10px] font-display font-bold px-2 py-0.5 rounded-full pixel-border bg-white/20 text-white">
                      ✅ Résolu
                    </span>
                  )}
                </div>
                <span className="text-white/30 text-xs font-display whitespace-nowrap">{formatDate(f.created_at)}</span>
              </div>
              <p className="font-display text-sm whitespace-pre-wrap mb-2">{f.message}</p>
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-xs font-display">{f.author.avatar_emoji} {f.author.display_name}</p>
                {canManage && (
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleResolve(f.id)} className="text-xs font-display font-bold text-potes-green">
                      {resolved ? 'Rouvrir' : 'Marquer résolu'}
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="text-xs font-display font-bold text-potes-flame">
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {visible.length === 0 && <p className="text-white/40 font-display">Rien à signaler pour l'instant 🎉</p>}
      </div>
    </div>
  )
}
