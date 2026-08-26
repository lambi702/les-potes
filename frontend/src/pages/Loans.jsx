import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Loans() {
  const { user: me } = useAuth()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  const load = () => api.listItems().then(setItems)
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) =>
      [it.name, it.description, it.category].join(' ').toLowerCase().includes(q)
    )
  }, [items, query])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await api.createItem({ name, description, category })
    setName(''); setDescription(''); setCategory(''); setShowForm(false)
    load()
  }

  const handleBorrow = async (id) => { await api.borrowItem(id); load() }
  const handleReturn = async (id) => { await api.returnItem(id); load() }
  const handleDelete = async (id) => { await api.deleteItem(id); load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">LE TROC</h1>
          <p className="text-white/50 font-display text-sm">Chargeur oublié ? Quelqu'un l'a sûrement en trop.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-potes-green text-potes-bg font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border"
        >
          + Proposer un objet
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 chercher un chargeur iPhone, une tente, une lampe..."
        className="w-full rounded-lg bg-potes-panel border-2 border-black px-4 py-2.5 font-display mb-5 focus:outline-none focus:ring-2 focus:ring-potes-red"
      />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-potes-panel pixel-border rounded-xl p-4 mb-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de l'objet (ex: chargeur iPhone)"
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Catégorie (optionnel, ex: électro, camping, cuisine...)"
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails (optionnel)"
            rows={2}
            className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm"
          />
          <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
            Ajouter
          </button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-potes-panel pixel-border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-bold">{item.name}</p>
                {item.category && <p className="text-white/40 text-xs font-display">{item.category}</p>}
              </div>
              <span
                className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full pixel-border whitespace-nowrap ${
                  item.status === 'available' ? 'bg-potes-green text-potes-bg' : 'bg-potes-flame text-white'
                }`}
              >
                {item.status === 'available' ? 'Dispo' : 'Emprunté'}
              </span>
            </div>
            {item.description && <p className="text-white/60 text-sm font-display">{item.description}</p>}
            <p className="text-white/40 text-xs font-display">
              {item.owner.avatar_emoji} {item.owner.display_name}
              {item.status === 'borrowed' && item.borrower && ` → emprunté par ${item.borrower.avatar_emoji} ${item.borrower.display_name}`}
            </p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {item.status === 'available' && item.owner.id !== me?.id && (
                <button onClick={() => handleBorrow(item.id)} className="bg-potes-green text-potes-bg text-xs font-display font-bold px-3 py-1 rounded-lg pixel-border">
                  Emprunter
                </button>
              )}
              {item.status === 'borrowed' && (item.borrower?.id === me?.id || item.owner.id === me?.id || me?.is_admin) && (
                <button onClick={() => handleReturn(item.id)} className="bg-white/10 hover:bg-white/20 text-xs font-display font-bold px-3 py-1 rounded-lg">
                  Marquer rendu
                </button>
              )}
              {(item.owner.id === me?.id || me?.is_admin) && (
                <button onClick={() => handleDelete(item.id)} className="text-potes-flame text-xs font-display font-bold px-2 py-1">
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-white/40 font-display">Rien trouvé. Sois le premier à proposer un truc !</p>}
      </div>
    </div>
  )
}
