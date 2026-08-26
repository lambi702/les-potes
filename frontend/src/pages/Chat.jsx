import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

function formatTime(iso) {
  return new Date(iso + 'Z').toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { user: me } = useAuth()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    api.listChatMessages().then(setMessages)

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/chat`)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setMessages((prev) => [...prev, msg])
    }
    return () => ws.close()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    await api.sendChatMessage(content.trim())
    setContent('')
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="arcade-title text-potes-gold text-base sm:text-lg">LE CHAT</h1>
        <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full ${connected ? 'bg-potes-green text-potes-bg' : 'bg-white/20 text-white/60'}`}>
          {connected ? '● en direct' : '○ hors ligne'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-potes-panel pixel-border rounded-xl p-4 space-y-3 mb-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.author.id === me?.id ? 'flex-row-reverse' : ''}`}>
            <span className="text-xl flex-shrink-0">{m.author.avatar_emoji}</span>
            <div className={`max-w-[75%] ${m.author.id === me?.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-xl px-3 py-2 font-display text-sm ${m.author.id === me?.id ? 'bg-potes-red text-white' : 'bg-white/10'}`}>
                {m.content}
              </div>
              <span className="text-white/30 text-[10px] font-display mt-0.5">
                {m.author.display_name} · {formatTime(m.created_at)}
              </span>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-white/40 font-display text-sm">Personne n'a encore écrit. Lance la discussion !</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écris un message..."
          className="flex-1 rounded-lg bg-potes-panel border-2 border-black px-3 py-2 font-display text-sm focus:outline-none focus:ring-2 focus:ring-potes-red"
        />
        <button type="submit" className="bg-potes-red text-white font-display font-bold text-sm px-4 py-2 rounded-lg pixel-border">
          Envoyer
        </button>
      </form>
    </div>
  )
}
