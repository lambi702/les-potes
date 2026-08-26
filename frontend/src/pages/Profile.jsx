import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import RoleBadge from '../components/RoleBadge'
import EmojiPicker from '../components/EmojiPicker'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me, refresh } = useAuth()
  const [participant, setParticipant] = useState(null)
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwError, setPwError] = useState('')

  const isSelf = me && Number(id) === me.id
  const canEdit = isSelf || me?.is_admin

  useEffect(() => {
    api.getParticipant(id).then((p) => {
      setParticipant(p)
      setBio(p.bio)
    })
  }, [id])

  if (!participant) return <p className="font-display text-white/50">Chargement...</p>

  const saveBio = async () => {
    const updated = await api.updateParticipant(participant.id, { bio })
    setParticipant(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const updateField = async (payload) => {
    const updated = await api.updateParticipant(participant.id, payload)
    setParticipant(updated)
    if (isSelf) refresh()
    return updated
  }

  const changeEmoji = (emoji) => updateField({ avatar_emoji: emoji })
  const changeRole = (role_label) => updateField({ role_label })
  const changeDisplayName = (display_name) => {
    if (display_name.trim()) updateField({ display_name: display_name.trim() })
  }
  const changeRealName = (real_name) => updateField({ real_name: real_name.trim() })

  const submitPasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    try {
      await api.changePassword({ current_password: currentPw, new_password: newPw })
      setPwOpen(false)
      setCurrentPw('')
      setNewPw('')
    } catch (err) {
      setPwError(err.message)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-potes-panel pixel-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{participant.avatar_emoji}</span>
          <div>
            <h1 className="font-display font-extrabold text-xl">{participant.display_name}</h1>
            {participant.real_name && <p className="text-white/40 text-sm font-display">{participant.real_name}</p>}
            <div className="mt-1"><RoleBadge role={participant.role_label} /></div>
          </div>
        </div>

        {canEdit && (
          <div>
            <p className="text-xs font-display font-bold text-white/60 mb-1">Pseudo (affiché partout sur le site)</p>
            <input
              key={`dn-${participant.display_name}`}
              defaultValue={participant.display_name}
              onBlur={(e) => changeDisplayName(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ex: Julie, Tchantchès, Le Marc..."
            />
          </div>
        )}

        {canEdit && (
          <div>
            <p className="text-xs font-display font-bold text-white/60 mb-1">Nom complet (plus sérieux, visible sur ta fiche)</p>
            <input
              key={`rn-${participant.real_name}`}
              defaultValue={participant.real_name}
              onBlur={(e) => changeRealName(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ex: Julie Dupont (optionnel)"
            />
          </div>
        )}

        {canEdit && (
          <div>
            <p className="text-xs font-display font-bold text-white/60 mb-2">Avatar</p>
            <EmojiPicker value={participant.avatar_emoji} onChange={changeEmoji} />
          </div>
        )}

        {canEdit && (
          <div>
            <p className="text-xs font-display font-bold text-white/60 mb-1">
              Rôle (jeu de mot bienvenu 😏) {isSelf && !me?.is_admin && '— c\'est ton surnom, choisis-le'}
            </p>
            <input
              key={participant.role_label}
              defaultValue={participant.role_label}
              onBlur={(e) => changeRole(e.target.value)}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="ex: Tchantchès, Peket Master, Bleu..."
            />
          </div>
        )}

        <div>
          <p className="text-xs font-display font-bold text-white/60 mb-1">Description</p>
          {canEdit ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={saveBio}
              rows={4}
              className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display focus:outline-none focus:ring-2 focus:ring-potes-red"
              placeholder="Ta légende, tes attentes, ton pire souvenir de festival..."
            />
          ) : (
            <p className="font-display text-white/80 whitespace-pre-wrap">{participant.bio || 'Rien à raconter (encore).'}</p>
          )}
          {saved && <p className="text-potes-green text-xs font-display mt-1">Enregistré ✓</p>}
        </div>

        {isSelf && (
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setPwOpen((v) => !v)}
              className="text-sm font-display font-bold text-white/60 hover:text-white"
            >
              🔑 Changer mon mot de passe
            </button>
            {pwOpen && (
              <form onSubmit={submitPasswordChange} className="mt-3 space-y-2">
                <input
                  type="password"
                  placeholder="Mot de passe actuel"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
                />
                {pwError && <p className="text-potes-flame text-xs font-display">{pwError}</p>}
                <button type="submit" className="bg-potes-green text-potes-bg font-display font-bold text-sm px-4 py-1.5 rounded-lg pixel-border">
                  Valider
                </button>
              </form>
            )}
          </div>
        )}

        <button onClick={() => navigate(-1)} className="text-white/40 text-xs font-display">← Retour</button>
      </div>
    </div>
  )
}
