import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const REACTIONS = ['❤️', '🔥', '😂', '👀', '😱']

function formatDate(iso) {
  return new Date(iso + 'Z').toLocaleString('fr-BE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function Journal() {
  const { user: me } = useAuth()
  const [posts, setPosts] = useState([])
  const [participants, setParticipants] = useState([])
  const [content, setContent] = useState('')
  const [taggedIds, setTaggedIds] = useState([])
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.listPosts().then(setPosts)
  useEffect(() => {
    load()
    api.listParticipants().then(setParticipants)
  }, [])

  const toggleTag = (id) => {
    setTaggedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!content.trim()) return
    try {
      await api.createPost({ content: content.trim(), tagged_ids: taggedIds })
      setContent(''); setTaggedIds([]); setShowTagPicker(false)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => { await api.deletePost(id); load() }
  const handleReact = async (id, emoji) => {
    const updated = await api.reactToPost(id, emoji)
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg mb-2">LES RAGOTS 👀</h1>
        <p className="text-white/50 font-display text-sm">
          Qui a chopé, qui a ronflé toute la nuit, qui a perdu ses chaussures... balance ta mise à jour.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-potes-panel pixel-border rounded-xl p-4 mb-6 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Il paraît que..."
          className="w-full rounded-lg bg-potes-bg border-2 border-black px-3 py-2 font-display text-sm focus:outline-none focus:ring-2 focus:ring-potes-red"
        />

        <button
          type="button"
          onClick={() => setShowTagPicker((v) => !v)}
          className="text-xs font-display font-bold text-white/60 hover:text-white"
        >
          🏷️ Taguer des gens {taggedIds.length > 0 && `(${taggedIds.length})`}
        </button>

        {showTagPicker && (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggleTag(p.id)}
                className={`text-xs font-display font-bold px-2.5 py-1 rounded-full pixel-border transition ${
                  taggedIds.includes(p.id) ? 'bg-potes-red text-white' : 'bg-white/5 text-white/60'
                }`}
              >
                {p.avatar_emoji} {p.display_name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-potes-flame text-sm font-display">{error}</p>}
        <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
          Publier le ragot
        </button>
      </form>

      <div className="space-y-4">
        {posts.map((post) => {
          const canDelete = me?.is_admin || post.author.id === me?.id
          return (
            <div key={post.id} className="bg-potes-panel pixel-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{post.author.avatar_emoji}</span>
                  <div>
                    <p className="font-display font-bold text-sm">{post.author.display_name}</p>
                    <p className="text-white/30 text-xs font-display">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                {canDelete && (
                  <button onClick={() => handleDelete(post.id)} className="text-potes-flame text-xs font-display font-bold flex-shrink-0">
                    Supprimer
                  </button>
                )}
              </div>

              <p className="font-display text-sm whitespace-pre-wrap mb-2">{post.content}</p>

              {post.tagged.length > 0 && (
                <p className="text-xs font-display text-white/50 mb-3">
                  avec {post.tagged.map((t) => `${t.avatar_emoji} ${t.display_name}`).join(', ')}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-2">
                {REACTIONS.map((emoji) => {
                  const count = post.reactions[emoji] || 0
                  const active = post.my_reactions.includes(emoji)
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(post.id, emoji)}
                      className={`text-xs font-display font-bold px-2 py-1 rounded-full pixel-border transition ${
                        active ? 'bg-potes-green text-potes-bg' : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {emoji} {count > 0 && count}
                    </button>
                  )
                })}
              </div>

              <CommentThread postId={post.id} me={me} />
            </div>
          )
        })}
        {posts.length === 0 && <p className="text-white/40 font-display">Aucun ragot pour l'instant. Sois le·a premier·ère 👀</p>}
      </div>
    </div>
  )
}

function CommentThread({ postId, me }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')

  const load = () => api.listComments(postId).then(setComments)

  const toggle = () => {
    setOpen((v) => !v)
    if (!comments) load()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await api.createComment(postId, text.trim())
    setText('')
    load()
  }

  const handleDelete = async (id) => { await api.deleteComment(id); load() }

  return (
    <div className="border-t border-white/10 pt-2">
      <button onClick={toggle} className="text-xs font-display font-bold text-white/50 hover:text-white">
        💭 {open ? 'Masquer' : 'Voir'} les commentaires{comments && comments.length > 0 && ` (${comments.length})`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {comments?.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-2 bg-white/5 rounded-lg px-3 py-1.5">
              <p className="text-sm font-display">
                <span className="font-bold">{c.author.avatar_emoji} {c.author.display_name}</span> {c.content}
              </p>
              {(c.author.id === me?.id || me?.is_admin) && (
                <button onClick={() => handleDelete(c.id)} className="text-potes-flame text-xs font-display flex-shrink-0">✕</button>
              )}
            </div>
          ))}
          {comments?.length === 0 && <p className="text-white/30 text-xs font-display">Aucun commentaire.</p>}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Réagir..."
              className="flex-1 rounded-lg bg-potes-bg border-2 border-black px-3 py-1.5 font-display text-sm"
            />
            <button type="submit" className="bg-white/10 hover:bg-white/20 text-xs font-display font-bold px-3 rounded-lg">
              Envoyer
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
