const EMOJIS = [
  '🙂','😎','🤠','🥳','🧢','🕺','💃','🧑‍🎤','👽','🤡','🐸','🦊','🐼','🦁','🐨','🐵',
  '🌈','🔥','⚡','🍕','🌵','🎸','🎧','🍺',
]

export default function EmojiPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-w-xs">
      {EMOJIS.map((e) => (
        <button
          type="button"
          key={e}
          onClick={() => onChange(e)}
          className={`text-xl rounded-md p-1 transition ${
            value === e ? 'bg-potes-red scale-110' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
