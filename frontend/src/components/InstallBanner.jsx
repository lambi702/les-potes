import { useEffect, useState } from 'react'

const DISMISS_KEY = 'potes_install_dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (installed || dismissed) return null
  if (!deferredPrompt && !isIOS()) return null // ni Android/Chrome installable, ni iOS : rien à proposer

  return (
    <div className="bg-potes-gold text-potes-bg px-4 py-2 flex items-center justify-between gap-3 text-sm font-display font-bold">
      {deferredPrompt ? (
        <>
          <span>📲 Installe Les Potes sur ton écran d'accueil</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleInstall} className="bg-potes-bg text-potes-gold px-3 py-1 rounded-lg pixel-border text-xs">
              Installer
            </button>
            <button onClick={dismiss} className="text-potes-bg/60 hover:text-potes-bg">✕</button>
          </div>
        </>
      ) : (
        <>
          <span>📲 Ajoute Les Potes à l'écran d'accueil : appuie sur <strong>􀈂 Partager</strong> puis <strong>"Sur l'écran d'accueil"</strong></span>
          <button onClick={dismiss} className="text-potes-bg/60 hover:text-potes-bg flex-shrink-0">✕</button>
        </>
      )}
    </div>
  )
}
