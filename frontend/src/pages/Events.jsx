import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const RSVP_OPTIONS = [
  { value: 'yes', label: '✅ Je viens', color: 'bg-potes-green text-potes-bg' },
  { value: 'maybe', label: '🤔 Peut-être', color: 'bg-potes-gold text-potes-bg' },
  { value: 'no', label: '❌ Pas dispo', color: 'bg-white/20 text-white' },
]

function formatDateTime(iso) {
  return new Date(iso + 'Z').toLocaleString('fr-BE', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function Events() {
  const { user: me } = useAuth()
  const [events, setEvents] = useState([])
  const [showPast, setShowPast] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)))
  const [error, setError] = useState('')

  const load = () => api.listEvents().then(setEvents)
  useEffect(() => { load() }, [])

  const now = Date.now()
  const visible = useMemo(
    () => events.filter((e) => showPast || new Date(e.starts_at + 'Z').getTime() >= now),
    [events, showPast, now]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !startsAt) return
    try {
      await api.createEvent({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        starts_at: new Date(startsAt).toISOString(),
      })
      setTitle(''); setLocation(''); setDescription(''); setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRsvp = async (id, status) => {
    const updated = await api.rsvpEvent(id, status)
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
  }

  const handleDelete = async (id) => { await api.deleteEvent(id); load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">CALENDRIER</h1>
          <p className="text-white/50 font-display text-sm">Propose un truc, les autres disent s'ils viennent.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-potes-green text-potes-bg font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border"
        >
          + Proposer un événement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-4 mb-6 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quoi ? (ex: Soirée jeux chez Marc)"
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Où ? (optionnel)"
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails (optionnel)"
            rows={2}
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          {error && <p className="text-potes-flame text-sm font-display">{error}</p>}
          <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
            Envoyer l'invit'
          </button>
        </form>
      )}

      <label className="flex items-center gap-2 text-sm font-display text-white/50 mb-3 cursor-pointer w-fit">
        <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} className="accent-potes-red" />
        Afficher les événements passés
      </label>

      <div className="space-y-4">
        {visible.map((event) => {
          const isPast = new Date(event.starts_at + 'Z').getTime() < now
          const canManage = me?.is_admin || event.created_by.id === me?.id
          const grouped = { yes: [], maybe: [], no: [] }
          event.rsvps.forEach((r) => grouped[r.status]?.push(r.user))

          return (
            <div key={event.id} className={`bg-potes-panel pixel-border rounded-xl p-4 ${isPast ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <p className="font-display font-extrabold text-base">{event.title}</p>
                  <p className="text-potes-gold text-xs font-display font-bold mt-0.5">{formatDateTime(event.starts_at)}</p>
                  {event.location && <p className="text-white/50 text-xs font-display">📍 {event.location}</p>}
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(event.id)} className="text-potes-flame text-xs font-display font-bold">
                    Supprimer
                  </button>
                )}
              </div>

              {event.description && <p className="font-display text-sm text-white/80 whitespace-pre-wrap mb-3">{event.description}</p>}

              <div className="flex gap-2 flex-wrap mb-3">
                {RSVP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRsvp(event.id, opt.value)}
                    className={`text-xs font-display font-bold px-3 py-1.5 rounded-lg pixel-border transition ${
                      event.my_status === opt.value ? opt.color : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {opt.label} {grouped[opt.value].length > 0 && `(${grouped[opt.value].length})`}
                  </button>
                ))}
              </div>

              {grouped.yes.length > 0 && (
                <p className="text-xs font-display text-white/40">
                  Viennent : {grouped.yes.map((u) => `${u.avatar_emoji} ${u.display_name}`).join(', ')}
                </p>
              )}
              <p className="text-white/30 text-xs font-display mt-1">Proposé par {event.created_by.avatar_emoji} {event.created_by.display_name}</p>
            </div>
          )
        })}
        {visible.length === 0 && <p className="text-white/40 font-display">Rien de prévu pour l'instant. Lance quelque chose !</p>}
      </div>
    </div>
  )
}
