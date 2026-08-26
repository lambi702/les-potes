import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import RoleBadge from '../components/RoleBadge'

const ROLE_SUGGESTIONS = ['Tchantchès', 'Nanesse', 'Peket Master', 'Rouche', 'Bleu']

function randomPassword() {
  return Math.random().toString(36).slice(2, 8)
}

export default function Admin() {
  const { user: me } = useAuth()
  const [participants, setParticipants] = useState([])
  const [inviteCode, setInviteCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [realName, setRealName] = useState('')
  const [roleLabel, setRoleLabel] = useState('Bleu')
  const [isAdmin, setIsAdmin] = useState(false)
  const [canManageMoney, setCanManageMoney] = useState(false)
  const [lastCreated, setLastCreated] = useState(null)
  const [error, setError] = useState('')
  const [resetInfo, setResetInfo] = useState(null)

  const load = () => api.listParticipants().then(setParticipants)
  useEffect(() => { load() }, [])
  useEffect(() => { api.getInviteCode().then((r) => setInviteCode(r.invite_code)) }, [])

  const joinUrl = inviteCode ? `${window.location.origin}/join?code=${inviteCode}` : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRegenerate = async () => {
    if (!confirm("Régénérer le code ? L'ancien lien ne fonctionnera plus.")) return
    const { invite_code } = await api.regenerateInviteCode()
    setInviteCode(invite_code)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    const password = randomPassword()
    try {
      const created = await api.createParticipant({
        username: username.trim(),
        display_name: displayName.trim() || username.trim(),
        real_name: realName.trim(),
        role_label: roleLabel,
        password,
        is_admin: isAdmin,
        can_manage_money: canManageMoney,
      })
      setLastCreated({ ...created, password })
      setUsername(''); setDisplayName(''); setRealName(''); setRoleLabel('Bleu'); setIsAdmin(false); setCanManageMoney(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Virer ce/cette pote du site ?')) return
    await api.deleteParticipant(id)
    load()
  }

  const handleReset = async (id) => {
    const { temp_password } = await api.resetPassword(id)
    setResetInfo({ id, temp_password })
  }

  const toggleFlag = async (p, field) => {
    const updated = await api.updateParticipant(p.id, { [field]: !p[field] })
    setParticipants((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">STAFF</h1>
        <p className="text-white/50 font-display text-sm">Ajoute tes potes, distribue les rôles et les droits.</p>
      </div>

      <div className="bg-potes-panel pixel-border rounded-xl p-5 max-w-lg space-y-3">
        <h2 className="font-display font-bold">🔗 Lien d'invitation</h2>
        <p className="text-white/50 text-sm font-display">
          Envoie ce lien à la bande — en l'ouvrant, iels peuvent s'inscrire elleux-mêmes, sans que tu doives créer chaque compte.
        </p>
        {joinUrl ? (
          <div className="flex gap-2 flex-wrap">
            <code className="flex-1 min-w-0 bg-potes-bg border-2 border-black rounded-lg px-3 py-2 text-xs font-display break-all">
              {joinUrl}
            </code>
            <button onClick={handleCopy} className="bg-potes-green text-potes-bg font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border whitespace-nowrap">
              {copied ? 'Copié ✓' : 'Copier'}
            </button>
          </div>
        ) : (
          <p className="text-white/40 text-sm font-display">Chargement...</p>
        )}
        <button onClick={handleRegenerate} className="text-potes-flame text-xs font-display font-bold">
          🔄 Régénérer le code (invalide l'ancien lien)
        </button>
      </div>

      <form onSubmit={handleCreate} className="bg-potes-panel pixel-border rounded-xl p-5 space-y-3 max-w-lg">
        <h2 className="font-display font-bold">➕ Ou ajouter un(e) pote toi-même</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Pseudo (identifiant de connexion)"
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
        />
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Pseudo affiché (ex: Julie)"
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
        />
        <input
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          placeholder="Nom complet (optionnel, ex: Julie Dupont)"
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
        />
        <div>
          <input
            list="role-suggestions"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="Rôle (jeu de mot bienvenu !)"
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <datalist id="role-suggestions">
            {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>
        <div className="flex gap-4 text-sm font-display">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="accent-potes-red" />
            Droits admin (staff)
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={canManageMoney} onChange={(e) => setCanManageMoney(e.target.checked)} className="accent-potes-red" />
            Gère la caisse
          </label>
        </div>
        {error && <p className="text-potes-flame text-sm font-display">{error}</p>}
        <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
          Ajouter au site
        </button>
      </form>

      {lastCreated && (
        <div className="bg-potes-green text-potes-bg pixel-border rounded-xl p-4 max-w-lg font-display text-sm">
          <p className="font-bold mb-1">✅ {lastCreated.display_name} a été ajouté(e) !</p>
          <p>Pseudo : <code className="font-bold">{lastCreated.username}</code></p>
          <p>Mot de passe temporaire : <code className="font-bold">{lastCreated.password}</code></p>
          <p className="text-xs mt-1">Transmets-lui ces identifiants (pas ici, en DM) — il/elle devra en choisir un autre à la première connexion.</p>
        </div>
      )}

      <div>
        <h2 className="font-display font-bold mb-3">👥 Tout le monde ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="bg-potes-panel pixel-border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.avatar_emoji}</span>
                <div>
                  <p className="font-display font-bold text-sm">{p.display_name} <span className="text-white/40">@{p.username}</span></p>
                  <RoleBadge role={p.role_label} small />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs font-display">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={p.is_admin} onChange={() => toggleFlag(p, 'is_admin')} className="accent-potes-red" />
                  Admin
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={p.can_manage_money} onChange={() => toggleFlag(p, 'can_manage_money')} className="accent-potes-red" />
                  Caisse
                </label>
                <button onClick={() => handleReset(p.id)} className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg font-bold">
                  🔑 Reset mdp
                </button>
                {p.id !== me?.id && (
                  <button onClick={() => handleDelete(p.id)} className="text-potes-flame font-bold px-2 py-1">
                    Virer
                  </button>
                )}
              </div>
              {resetInfo?.id === p.id && (
                <p className="w-full text-potes-green text-xs font-display">
                  Nouveau mot de passe temporaire : <code className="font-bold">{resetInfo.temp_password}</code>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
