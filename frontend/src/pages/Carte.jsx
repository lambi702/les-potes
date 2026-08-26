import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

// Vite casse la résolution d'assets par défaut de Leaflet — fix standard.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const LIEGE_CENTER = [50.6326, 5.5797] // centre par défaut : Liège 🏛️

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng)
    },
  })
  return null
}

export default function Carte() {
  const { user: me, refresh } = useAuth()
  const [participants, setParticipants] = useState([])
  const [pending, setPending] = useState(null) // { lat, lng }
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api.listParticipants().then(setParticipants)
  useEffect(() => { load() }, [])

  const pinned = participants.filter((p) => p.home_lat != null && p.home_lng != null)
  const center = pinned.length > 0 ? [pinned[0].home_lat, pinned[0].home_lng] : LIEGE_CENTER

  const handlePick = (latlng) => {
    setPending({ lat: latlng.lat, lng: latlng.lng })
    setLabel(me?.home_label || '')
  }

  const handleSave = async () => {
    if (!pending) return
    setSaving(true)
    try {
      await api.updateParticipant(me.id, {
        home_lat: pending.lat,
        home_lng: pending.lng,
        home_label: label.trim(),
      })
      setPending(null)
      load()
      refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    await api.updateParticipant(me.id, { home_lat: null, home_lng: null, home_label: '' })
    load()
    refresh()
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">LA CARTE</h1>
        <p className="text-white/50 font-display text-sm">
          Clique sur la carte pour épingler chez toi — pratique pour le covoiturage ou les visites improvisées.
        </p>
      </div>

      <div className="pixel-border rounded-lg overflow-hidden mb-4" style={{ height: 420 }}>
        <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={handlePick} />
          {pinned.map((p) => (
            <Marker key={p.id} position={[p.home_lat, p.home_lng]}>
              <Popup>
                <span className="font-bold">{p.avatar_emoji} {p.display_name}</span>
                {p.home_label && <><br />{p.home_label}</>}
              </Popup>
            </Marker>
          ))}
          {pending && <Marker position={[pending.lat, pending.lng]} />}
        </MapContainer>
      </div>

      {pending && (
        <div className="bg-potes-panel pixel-border rounded-xl p-4 mb-4 space-y-3 max-w-md">
          <p className="font-display font-bold text-sm">📍 Épingler cet endroit comme le tien ?</p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex: Chez moi, Chez mes parents..."
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-potes-green text-potes-bg font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border disabled:opacity-50"
            >
              {saving ? '...' : 'Enregistrer'}
            </button>
            <button onClick={() => setPending(null)} className="bg-white/10 hover:bg-white/20 text-sm font-display font-bold px-4 py-2 rounded-lg">
              Annuler
            </button>
          </div>
        </div>
      )}

      {me?.home_lat != null && !pending && (
        <button onClick={handleRemove} className="text-potes-flame text-xs font-display font-bold">
          🗑️ Retirer mon épingle
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {pinned.map((p) => (
          <span key={p.id} className="text-xs font-display bg-white/5 rounded-full px-3 py-1">
            {p.avatar_emoji} {p.display_name}{p.home_label && ` · ${p.home_label}`}
          </span>
        ))}
        {pinned.length === 0 && <p className="text-white/40 font-display text-sm">Personne n'a encore épinglé son coin.</p>}
      </div>
    </div>
  )
}
