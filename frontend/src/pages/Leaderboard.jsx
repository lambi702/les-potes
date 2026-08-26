import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const SECTIONS = [
  { key: 'most_points', title: '🏆 Le plus de points', unit: 'pts' },
  { key: 'most_posts', title: '📝 Le plus de ragots', unit: '' },
  { key: 'most_reactions', title: '❤️ Le plus de réactions reçues', unit: '' },
  { key: 'most_items', title: '🔧 Le plus d\'objets au Troc', unit: '' },
  { key: 'longest_streak', title: '🔥 Le plus gros streak d\'événements', unit: '' },
]

export default function Leaderboard() {
  const [data, setData] = useState(null)

  useEffect(() => { api.getLeaderboard().then(setData) }, [])

  if (!data) return <p className="font-display text-white/50">Chargement...</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">CLASSEMENT</h1>
        <p className="text-white/50 font-display text-sm">Qui domine chez Les Potes ?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const entries = data[section.key] || []
          return (
            <div key={section.key} className="bg-potes-panel pixel-border rounded-xl p-4">
              <h2 className="font-display font-bold text-sm mb-3">{section.title}</h2>
              {entries.length === 0 ? (
                <p className="text-white/40 text-sm font-display">Personne pour l'instant</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <Link
                      key={entry.user.id}
                      to={`/participant/${entry.user.id}`}
                      className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 -mx-2"
                    >
                      <span className="text-xs font-display font-bold text-white/40 w-4">{i + 1}</span>
                      <span className="text-xl">{entry.user.avatar_emoji}</span>
                      <span className="font-display font-semibold text-sm flex-1">{entry.user.display_name}</span>
                      <span className="text-xs font-display font-bold text-potes-gold">{entry.value}{section.unit}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
