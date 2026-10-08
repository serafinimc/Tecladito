import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import './App.css'

const COLORS = ['#ff725e', '#ffb703', '#7bc950', '#28b8d5', '#6c63ff', '#d65db1']
const PROTECTION_MS = 3000
const BLOCKED_KEYS = new Set([
  'Escape', 'Tab', 'CapsLock', 'Control', 'Alt', 'Meta', 'ContextMenu',
  'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'PrintScreen',
  'ScrollLock', 'Pause', 'NumLock',
  ...Array.from({ length: 24 }, (_, index) => `F${index + 1}`),
])

type LetterPop = {
  id: number
  value: string
  color: string
  x: number
  y: number
  tilt: number
  size: number
}

type PlayMode = 'preschool' | 'words' | 'writer'

const MODES: { id: PlayMode; icon: string; label: string; age: string }[] = [
  { id: 'preschool', icon: '✦', label: 'Preescolar', age: '2–5 años' },
  { id: 'words', icon: 'ABC', label: 'Primeras palabras', age: '6–7 años' },
  { id: 'writer', icon: '✎', label: 'Escritura libre', age: '8+ años' },
]

const MODE_COPY: Record<PlayMode, { eyebrow: string; title: string; description: string }> = {
  preschool: {
    eyebrow: 'Jugamos con el teclado',
    title: '¡Hacé llover letras!',
    description: 'Cada tecla se convierte en una letra gigante, colorida y saltarina.',
  },
  words: {
    eyebrow: 'Descubrimos las palabras',
    title: '¡Escribí tu primera palabra!',
    description: 'Mirá cada letra bien grande mientras armás palabras a tu manera.',
  },
  writer: {
    eyebrow: 'Un espacio para crear',
    title: '¿Qué historia imaginamos hoy?',
    description: 'Un cuaderno simple y tranquilo para escribir todo lo que se te ocurra.',
  },
}

type ProtectedKey = {
  key: string
  startedAt: number
}

function App() {
  const [mode, setMode] = useState<PlayMode>('preschool')
  const [text, setText] = useState('')
  const [lastKey, setLastKey] = useState('¡HOLA!')
  const [soundOn, setSoundOn] = useState(true)
  const [keepLetters, setKeepLetters] = useState(true)
  const [uppercaseOnly, setUppercaseOnly] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFullscreenHelp, setShowFullscreenHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [isFirstSetup, setIsFirstSetup] = useState(true)
  const [settingsHold, setSettingsHold] = useState(0)
  const [protectedKey, setProtectedKey] = useState<ProtectedKey | null>(null)
  const [protectionProgress, setProtectionProgress] = useState(0)
  const [releasedKey, setReleasedKey] = useState('')
  const [pops, setPops] = useState<LetterPop[]>([])
  const nextId = useRef(0)
  const audioContext = useRef<AudioContext | null>(null)
  const heldKeys = useRef(new Map<string, number>())
  const unlockedUntil = useRef(new Map<string, number>())
  const settingsHoldStarted = useRef(0)
  const settingsHoldTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (settingsHoldTimer.current !== null) window.clearInterval(settingsHoldTimer.current)
  }, [])

  const playNote = useCallback((letter: string) => {
    if (!soundOn) return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = audioContext.current ?? new AudioContextClass()
    audioContext.current = context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const code = letter.toLowerCase().charCodeAt(0)

    oscillator.type = 'sine'
    oscillator.frequency.value = 280 + (code % 12) * 22
    gain.gain.setValueAtTime(0.055, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.16)
  }, [soundOn])

  const addPop = useCallback((value: string) => {
    const id = nextId.current++
    const displayValue = uppercaseOnly ? value.toLocaleUpperCase('es-AR') : value
    const pop: LetterPop = {
      id,
      value: displayValue === ' ' ? '★' : displayValue,
      color: COLORS[id % COLORS.length],
      x: 8 + Math.random() * 80,
      y: 10 + Math.random() * 68,
      tilt: -18 + Math.random() * 36,
      size: 72 + Math.random() * 56,
    }
    setPops((current) => [...current.slice(mode === 'preschool' ? -17 : -10), pop])
    if (mode !== 'preschool' || !keepLetters) {
      window.setTimeout(() => {
        setPops((current) => current.filter((item) => item.id !== id))
      }, mode === 'preschool' ? 800 : 1000)
    }
  }, [keepLetters, mode, uppercaseOnly])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSettings || event.target instanceof HTMLButtonElement) return
      const isBlocked = BLOCKED_KEYS.has(event.key) || event.ctrlKey || event.altKey || event.metaKey

      if (isBlocked) {
        const modifierKey = event.metaKey ? 'Meta' : event.altKey ? 'Alt' : event.ctrlKey ? 'Control' : event.key
        const allSpecialKeysUnlocked = (unlockedUntil.current.get('*') ?? 0) > performance.now()
        if (allSpecialKeysUnlocked || (unlockedUntil.current.get(modifierKey) ?? 0) > performance.now()) {
          if (event.key === 'F11') setShowFullscreenHelp(false)
          return
        }

        const startedAt = heldKeys.current.get(modifierKey) ?? performance.now()
        heldKeys.current.set(modifierKey, startedAt)
        const elapsed = performance.now() - startedAt

        if (elapsed < PROTECTION_MS) {
          event.preventDefault()
          event.stopPropagation()
          setProtectedKey((current) => current?.key === modifierKey && current.startedAt === startedAt
            ? current
            : { key: modifierKey, startedAt })
          return
        }

        setProtectedKey(null)
        setProtectionProgress(100)
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        if (mode === 'preschool') {
          setPops((current) => current.slice(0, -1))
          return
        }
        setText((current) => current.slice(0, -1))
        setLastKey('⌫')
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        if (mode === 'preschool') {
          addPop('♥')
          playNote('m')
          return
        }
        setText((current) => `${current}\n`.slice(-280))
        setLastKey('↵')
        addPop('★')
        playNote('m')
        return
      }

      if (event.key.length === 1) {
        event.preventDefault()
        const typedValue = uppercaseOnly ? event.key.toLocaleUpperCase('es-AR') : event.key
        if (mode !== 'preschool') setText((current) => `${current}${typedValue}`.slice(-600))
        setLastKey(typedValue === ' ' ? 'espacio' : typedValue)
        addPop(typedValue)
        playNote(typedValue)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      heldKeys.current.delete(event.key)
      setProtectedKey((current) => {
        if (current?.key !== event.key) return current
        setProtectionProgress(0)
        return null
      })
    }

    const blockContextMenu = (event: MouseEvent) => event.preventDefault()
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    window.addEventListener('contextmenu', blockContextMenu)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      window.removeEventListener('contextmenu', blockContextMenu)
    }
  }, [addPop, mode, playNote, showSettings, uppercaseOnly])

  useEffect(() => {
    if (!protectedKey) return

    const updateProgress = () => {
      const nextProgress = Math.min(100, ((performance.now() - protectedKey.startedAt) / PROTECTION_MS) * 100)
      setProtectionProgress(nextProgress)
      if (nextProgress >= 100) {
        unlockedUntil.current.set('*', performance.now() + 5000)
        setReleasedKey('Todas')
        setProtectedKey(null)
        window.setTimeout(() => setReleasedKey(''), 1800)
      }
    }

    updateProgress()
    const interval = window.setInterval(updateProgress, 40)
    return () => window.clearInterval(interval)
  }, [protectedKey])

  useEffect(() => {
    const detectBrowserFullscreen = () => {
      const active = window.innerHeight >= window.screen.height - 2
      setIsFullscreen(active)
      if (active) setShowFullscreenHelp(false)
    }

    detectBrowserFullscreen()
    window.addEventListener('resize', detectBrowserFullscreen)
    return () => window.removeEventListener('resize', detectBrowserFullscreen)
  }, [])

  const prepareFullscreen = () => {
    unlockedUntil.current.set('F11', performance.now() + 7000)
    setShowSettings(false)
    setShowFullscreenHelp(true)
  }

  const stopSettingsHold = () => {
    if (settingsHoldTimer.current !== null) window.clearInterval(settingsHoldTimer.current)
    settingsHoldTimer.current = null
    settingsHoldStarted.current = 0
    setSettingsHold(0)
  }

  const startSettingsHold = () => {
    if (settingsHoldTimer.current !== null) return
    settingsHoldStarted.current = performance.now()
    setSettingsHold(1)
    settingsHoldTimer.current = window.setInterval(() => {
      const progress = Math.min(100, ((performance.now() - settingsHoldStarted.current) / 3000) * 100)
      setSettingsHold(progress)
      if (progress >= 100) {
        stopSettingsHold()
        setShowSettings(true)
      }
    }, 35)
  }

  const startPlaying = () => {
    setIsFirstSetup(false)
    setShowSettings(false)
  }

  const changeMode = (nextMode: PlayMode) => {
    setMode(nextMode)
    setText('')
    setPops([])
    setLastKey(nextMode === 'words' ? (uppercaseOnly ? '¡HOLA!' : '¡Hola!') : '')
  }

  const clearPlayground = () => {
    setText('')
    setPops([])
    setLastKey(mode === 'words' ? (uppercaseOnly ? '¡OTRA VEZ!' : '¡Otra vez!') : '')
  }

  const toggleKeepLetters = () => {
    const next = !keepLetters
    setKeepLetters(next)
    if (!next) setPops([])
  }

  const toggleUppercase = () => {
    const next = !uppercaseOnly
    setUppercaseOnly(next)
    if (next) {
      setText((value) => value.toLocaleUpperCase('es-AR'))
      setLastKey((value) => value.toLocaleUpperCase('es-AR'))
      setPops((items) => items.map((item) => ({ ...item, value: item.value.toLocaleUpperCase('es-AR') })))
    }
  }

  const copy = MODE_COPY[mode]

  return (
    <main className="app-shell">
      <button
        className="settings-trigger"
        type="button"
        aria-label="Mantener presionado tres segundos para abrir la configuración"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startSettingsHold() }}
        onPointerUp={stopSettingsHold}
        onPointerCancel={stopSettingsHold}
        onLostPointerCapture={stopSettingsHold}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
            event.preventDefault()
            startSettingsHold()
          }
        }}
        onKeyUp={(event) => {
          if (event.key === 'Enter' || event.key === ' ') stopSettingsHold()
        }}
        style={{ '--hold': `${settingsHold * 3.6}deg` } as CSSProperties}
      >
        <span aria-hidden="true">⚙</span>
        {settingsHold > 0 && <small>{Math.ceil(3 * (1 - settingsHold / 100))}</small>}
      </button>

      <header className="topbar">
        <a className="brand" href="#playground" aria-label="Tecladito, inicio">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>Tecladito</span>
        </a>

        <div className="status-pill" role="status">
          <span className="status-dot" />
          Teclas especiales protegidas
        </div>

        <div className="header-actions">
          <button className="icon-button" type="button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? 'Desactivar sonido' : 'Activar sonido'}>
            {soundOn ? '♫' : '♩'}
          </button>
          <button className="fullscreen-button" type="button" onClick={prepareFullscreen}>
            <span aria-hidden="true">{isFullscreen ? '↙' : '↗'}</span>
            {isFullscreen ? 'Salir con F11' : 'Pantalla completa'}
          </button>
        </div>
      </header>

      <section className="hero-copy">
        <div className="eyebrow"><span>✦</span> {copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </section>

      <nav className="mode-picker" aria-label="Elegir modo según la edad">
        {MODES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={mode === item.id ? 'mode-option active' : 'mode-option'}
            onClick={() => changeMode(item.id)}
            aria-pressed={mode === item.id}
          >
            <span className="mode-icon" aria-hidden="true">{item.icon}</span>
            <span><strong>{item.label}</strong><small>{item.age}</small></span>
          </button>
        ))}
      </nav>

      <section id="playground" className={`playground playground-${mode}`} aria-label={`Modo ${MODES.find((item) => item.id === mode)?.label}`}>
        <div className="decoration decoration-one" aria-hidden="true">✦</div>
        <div className="decoration decoration-two" aria-hidden="true">●</div>
        <div className="decoration decoration-three" aria-hidden="true">✿</div>
        {pops.map((pop) => (
          <span
            className="letter-pop"
            key={pop.id}
            style={mode === 'preschool'
              ? { left: `${pop.x}%`, top: `${pop.y}%`, color: pop.color, fontSize: `${pop.size}px`, '--tilt': `${pop.tilt}deg` } as CSSProperties
              : { left: `${pop.x}%`, color: pop.color, '--tilt': `${pop.tilt}deg` } as CSSProperties}
            aria-hidden="true"
          >
            {pop.value}
          </span>
        ))}

        {mode === 'preschool' && pops.length === 0 && (
          <div className="preschool-prompt" aria-live="polite">
            <span aria-hidden="true">A</span>
            <strong>¡Apretá una tecla!</strong>
            <small>Probá con letras, números o el espacio</small>
          </div>
        )}

        {mode === 'words' && (
          <>
            <div className="key-display" aria-live="polite">{lastKey}</div>
            <div className="typed-paper">
              {text ? <span>{text}</span> : <span className="placeholder">Empezá a escribir…</span>}
              <span className="cursor" aria-hidden="true" />
            </div>
          </>
        )}

        {mode === 'writer' && (
          <div className="writer-paper" aria-live="polite">
            {text ? <span>{text}</span> : <span className="placeholder">Había una vez…</span>}
            <span className="cursor" aria-hidden="true" />
          </div>
        )}

        <button className="clear-button" type="button" onClick={clearPlayground} disabled={!text && !pops.length}>
          <span aria-hidden="true">↻</span> {mode === 'preschool' ? 'Limpiar las letras' : 'Borrar y empezar de nuevo'}
        </button>

        {protectedKey && (
          <div
            className="key-hold-indicator"
            role="status"
            aria-label={`Mantené ${protectedKey.key === 'Control' ? 'Ctrl' : protectedKey.key} apretada`}
            style={{ '--key-progress': `${protectionProgress * 3.6}deg` } as CSSProperties}
          >
            <span aria-hidden="true">{protectedKey.key === 'Control' ? 'Ctrl' : protectedKey.key.replace('Escape', 'Esc')}</span>
          </div>
        )}
        {releasedKey && (
          <div className="key-released-indicator" role="status" aria-label="Teclas especiales habilitadas por 5 segundos">
            <span aria-hidden="true">✓</span>
          </div>
        )}
      </section>

      <section className="grownups-note" aria-label="Información para adultos">
        <div className="shield" aria-hidden="true">✓</div>
        <div>
          <strong>Modo protegido</strong>
          <p>Mantené Esc, Ctrl, Alt o F1–F12 durante 3 segundos para usarlas. La tecla Windows depende del sistema.</p>
        </div>
        <button type="button" onClick={prepareFullscreen}>{isFullscreen ? 'Salir con F11' : 'Activar pantalla completa'}</button>
      </section>

      {showSettings && (
        <div className="settings-backdrop" role="presentation">
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header className="settings-heading">
              <div>
                <span>{isFirstSetup ? 'Antes de jugar' : 'Área de adultos'}</span>
                <h2 id="settings-title">{isFirstSetup ? 'Preparemos Tecladito' : 'Configuración'}</h2>
              </div>
              {!isFirstSetup && <button type="button" onClick={() => setShowSettings(false)} aria-label="Cerrar configuración">×</button>}
            </header>

            <div className="settings-section">
              <h3>Elegí una etapa</h3>
              <div className="settings-mode-grid">
                {MODES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={mode === item.id ? 'mode-option active' : 'mode-option'}
                    onClick={() => changeMode(item.id)}
                    aria-pressed={mode === item.id}
                  >
                    <span className="mode-icon" aria-hidden="true">{item.icon}</span>
                    <span><strong>{item.label}</strong><small>{item.age}</small></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section settings-controls">
              <button type="button" onClick={() => setSoundOn((value) => !value)}>
                <span aria-hidden="true">{soundOn ? '♫' : '♩'}</span>
                <span><strong>Sonido</strong><small>{soundOn ? 'Activado' : 'Desactivado'}</small></span>
                <i className={soundOn ? 'switch on' : 'switch'} aria-hidden="true" />
              </button>
              <button type="button" onClick={prepareFullscreen}>
                <span aria-hidden="true">↗</span>
                <span><strong>Pantalla completa</strong><small>Preparar tecla F11</small></span>
                <b aria-hidden="true">›</b>
              </button>
              <button type="button" onClick={toggleKeepLetters}>
                <span aria-hidden="true">◎</span>
                <span><strong>Mantener letras</strong><small>{keepLetters ? 'Quedan en pantalla' : 'Desaparecen solas'}</small></span>
                <i className={keepLetters ? 'switch on' : 'switch'} aria-hidden="true" />
              </button>
              <button type="button" onClick={toggleUppercase}>
                <span className="letters-setting" aria-hidden="true">AA</span>
                <span><strong>Solo mayúsculas</strong><small>{uppercaseOnly ? 'Activado' : 'Mayúsculas y minúsculas'}</small></span>
                <i className={uppercaseOnly ? 'switch on' : 'switch'} aria-hidden="true" />
              </button>
            </div>

            <div className="settings-security">
              <span aria-hidden="true">✓</span>
              <p><strong>Protección activa</strong> Mantené cualquier tecla especial durante 3 segundos para habilitarlas todas por 5 segundos.</p>
            </div>

            {isFirstSetup && (
              <button className="start-playing-button" type="button" onClick={startPlaying}>
                Empezar a jugar <span aria-hidden="true">→</span>
              </button>
            )}
          </section>
        </div>
      )}

      {showFullscreenHelp && (
        <div className="fullscreen-help" role="dialog" aria-modal="true" aria-labelledby="fullscreen-title">
          <div className="fullscreen-help-card">
            <span className="keyboard-key" aria-hidden="true">F11</span>
            <div>
              <strong id="fullscreen-title">Ahora presioná F11</strong>
              <p>La tecla está habilitada por 7 segundos. Este modo evita que un toque accidental de Esc cierre la pantalla completa.</p>
            </div>
            <button type="button" onClick={() => setShowFullscreenHelp(false)} aria-label="Cerrar indicación">×</button>
          </div>
        </div>
      )}
    </main>
  )
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }

}

export default App
