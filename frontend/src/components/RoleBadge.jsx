const ROLE_COLORS = {
  'Tchantchès': 'bg-potes-red text-white',
  'Peket Master': 'bg-potes-gold text-potes-bg',
  'Bleu': 'bg-potes-green text-potes-bg',
  'Rouche': 'bg-potes-flame text-white',
}

export default function RoleBadge({ role, small = false }) {
  const color = ROLE_COLORS[role] || 'bg-white/20 text-white'
  return (
    <span
      className={`inline-block ${color} font-display font-bold rounded-full pixel-border ${
        small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      {role}
    </span>
  )
}
