import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import RoleBadge from '../components/RoleBadge'

function isBirthdayToday(birthday) {
  if (!birthday) return false
  const today = new Date()
  const [, month, day] = birthday.split('-').map(Number)
  return today.getMonth() + 1 === month && today.getDate() === day
}

export default function Dashboard() {
  const [participants, setParticipants] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listParticipants().then(setParticipants).catch((e) => setError(e.message))
  }, [])

  const birthdays = participants?.filter((p) => isBirthdayToday(p.birthday)) || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">LE QG</h1>
        <p className="text-white/50 font-display">
          {participants ? `${participants.length} potes dans la place` : 'Chargement...'}
        </p>
      </div>

      {birthdays.length > 0 && (
        <div className="bg-potes-gold text-potes-bg pixel-border rounded-xl p-4 mb-6 font-display font-bold">
          🎉 Aujourd'hui c'est l'anniversaire de {birthdays.map((b) => `${b.avatar_emoji} ${b.display_name}`).join(', ')} !
        </div>
      )}

      {error && <p className="text-potes-flame font-display">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {participants?.map((p) => (
          <Link
            key={p.id}
            to={`/participant/${p.id}`}
            className="bg-potes-panel hover:bg-potes-panel2 pixel-border rounded-xl p-4 flex flex-col items-center text-center gap-2 transition hover:-translate-y-0.5"
          >
            <span className="text-4xl">{p.avatar_emoji} {isBirthdayToday(p.birthday) && '🎂'}</span>
            <span className="font-display font-bold text-sm">{p.display_name}</span>
            <RoleBadge role={p.role_label} small />
            {p.availability_status && (
              <span className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                {p.availability_status}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
