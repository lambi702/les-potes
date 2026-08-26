import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import RoleBadge from '../components/RoleBadge'

export default function Dashboard() {
  const [participants, setParticipants] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.listParticipants().then(setParticipants).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">LE QG</h1>
        <p className="text-white/50 font-display">
          {participants ? `${participants.length} potes dans la place` : 'Chargement...'}
        </p>
      </div>

      {error && <p className="text-potes-flame font-display">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {participants?.map((p) => (
          <Link
            key={p.id}
            to={`/participant/${p.id}`}
            className="bg-potes-panel hover:bg-potes-panel2 pixel-border rounded-xl p-4 flex flex-col items-center text-center gap-2 transition hover:-translate-y-0.5"
          >
            <span className="text-4xl">{p.avatar_emoji}</span>
            <span className="font-display font-bold text-sm">{p.display_name}</span>
            <RoleBadge role={p.role_label} small />
          </Link>
        ))}
      </div>
    </div>
  )
}
