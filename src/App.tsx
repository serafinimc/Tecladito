import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import './App.css'

const COLORS = ['var(--letter-coral)', 'var(--letter-yellow)', 'var(--letter-green)', 'var(--letter-cyan)', 'var(--letter-purple)', 'var(--letter-pink)']
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

type PlayMode = 'preschool' | 'words' | 'writer' | 'repeat'
const PRACTICE_KEYS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789'.split('')
const PRACTICE_PRAISES = ['muy-bien', 'excelente', 'perfecto', 'genial', 'si', 'lo-encontraste']
const choosePracticeKey = (previous = '') => {
  const candidates = PRACTICE_KEYS.filter((key) => key !== previous)
  return candidates[Math.floor(Math.random() * candidates.length)]
}
type Theme = 'light' | 'dark'
type SoundMode = 'voice' | 'tone' | 'off'
type SoundType = Exclude<SoundMode, 'off'>
type Scene = 'classic' | 'space' | 'ocean' | 'forest'

const MODES: { id: PlayMode; icon: string; label: string; age: string }[] = [
  { id: 'preschool', icon: '✦', label: 'Preescolar', age: '2–5 años' },
  { id: 'words', icon: 'ABC', label: 'Primeras palabras', age: '6–7 años' },
  { id: 'writer', icon: '✎', label: 'Escritura libre', age: '8+ años' },
  { id: 'repeat', icon: '♫', label: 'Escuchá y encontrá', age: '4+ años' },
]

const SCENES: { id: Scene; icon: string; label: string }[] = [
  { id: 'classic', icon: '✦', label: 'Clásico' },
  { id: 'space', icon: '🪐', label: 'Espacio' },
  { id: 'ocean', icon: '🐠', label: 'Océano' },
  { id: 'forest', icon: '🍃', label: 'Bosque' },
]

const SCENE_DECORATIONS: Record<Scene, [string, string, string]> = {
  classic: ['✦', '●', '✿'],
  space: ['🪐', '★', '☄'],
  ocean: ['🐠', '○', '〰'],
  forest: ['🍃', '🌼', '🦋'],
}

const SCENE_PATTERNS: Record<Scene, string[]> = {
  classic: ['✦', '●', '✿', '★', '○', '◆', '✧', '●', '❋', '◇', '✦', '○'],
  space: ['✦', '🪐', '🚀', '★', '☄', '🌙', '✧', '🛸', '⭐', '🌎', '✨', '●'],
  ocean: ['🫧', '🐠', '🐙', '○', '🐳', '🐚', '🪼', '🌊', '🐡', '🫧', '⭐', '🐟'],
  forest: ['🍃', '🌳', '🍄', '🦋', '🌼', '🐞', '🌿', '🍂', '🐿️', '🌻', '🪺', '☘️'],
}

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
  repeat: { eyebrow: 'Escuchá y encontrá', title: '¿Dónde está esa tecla?', description: 'Escuchá la letra y buscala en el teclado.' },
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
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)
  const [text, setText] = useState('')
  const [lastKey, setLastKey] = useState('¡HOLA!')
  const [soundType, setSoundType] = useState<SoundType>('voice')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundMode: SoundMode = soundEnabled ? soundType : 'off'
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('tecladito-theme') === 'dark' ? 'dark' : 'light')
  const [scene, setScene] = useState<Scene>(() => {
    const savedScene = localStorage.getItem('tecladito-scene')
    return savedScene === 'space' || savedScene === 'ocean' || savedScene === 'forest' ? savedScene : 'classic'
  })
  const [keepLetters, setKeepLetters] = useState(true)
  const [uppercaseOnly, setUppercaseOnly] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFullscreenHelp, setShowFullscreenHelp] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [isFirstSetup, setIsFirstSetup] = useState(true)
  const [closeUnavailable, setCloseUnavailable] = useState(false)
  const [settingsHold, setSettingsHold] = useState(0)
  const [protectedKey, setProtectedKey] = useState<ProtectedKey | null>(null)
  const [protectionProgress, setProtectionProgress] = useState(0)
  const [releasedKey, setReleasedKey] = useState('')
  const [pops, setPops] = useState<LetterPop[]>([])
  const [practiceTarget, setPracticeTarget] = useState(() => choosePracticeKey())
  const [practiceScore, setPracticeScore] = useState(0)
  const [practiceFeedback, setPracticeFeedback] = useState<'ready' | 'correct' | 'wrong'>('ready')
  const practiceTimer = useRef<number | null>(null)
  const practiceAudio = useRef<HTMLAudioElement | null>(null)
  const practicePromptId = useRef(0)
  const lastPracticePraise = useRef('')
  const practiceTargetRef = useRef(practiceTarget)
  useEffect(() => {
    practiceTargetRef.current = practiceTarget
  }, [practiceTarget])
  const nextId = useRef(0)
  const audioContext = useRef<AudioContext | null>(null)
  const characterAudio = useRef<HTMLAudioElement | null>(null)
  const writerPaper = useRef<HTMLDivElement | null>(null)
  const heldKeys = useRef(new Map<string, number>())
  const unlockedUntil = useRef(new Map<string, number>())
  const settingsHoldStarted = useRef(0)
  const settingsHoldTimer = useRef<number | null>(null)
  const returnToSettingsAfterFullscreen = useRef(false)

  useEffect(() => () => {
    if (practiceTimer.current !== null) window.clearTimeout(practiceTimer.current)
    practicePromptId.current += 1
    practiceAudio.current?.pause()
    if (settingsHoldTimer.current !== null) window.clearInterval(settingsHoldTimer.current)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('tecladito-theme', theme)
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('tecladito-scene', scene)
  }, [scene])

  useEffect(() => {
    if (soundMode === 'voice') return
    characterAudio.current?.pause()
    characterAudio.current = null
  }, [soundMode])

  useEffect(() => {
    if (mode !== 'writer' || !writerPaper.current) return
    writerPaper.current.scrollTop = writerPaper.current.scrollHeight
  }, [mode, text])

  const finishFullscreenSetup = useCallback(() => {
    setShowFullscreenHelp(false)
    if (returnToSettingsAfterFullscreen.current) {
      returnToSettingsAfterFullscreen.current = false
      setShowSettings(true)
    } else {
      window.requestAnimationFrame(() => document.getElementById('playground')?.focus({ preventScroll: true }))
    }
  }, [])

  const playNote = useCallback((letter: string) => {
    if (soundMode !== 'tone') return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = audioContext.current ?? new AudioContextClass()
    audioContext.current = context

    if (mode === 'writer') {
      const duration = 0.045
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
      const samples = buffer.getChannelData(0)
      for (let index = 0; index < samples.length; index += 1) {
        const decay = Math.pow(1 - index / samples.length, 4)
        samples[index] = (Math.random() * 2 - 1) * decay
      }

      const click = context.createBufferSource()
      const clickFilter = context.createBiquadFilter()
      const clickGain = context.createGain()
      click.buffer = buffer
      clickFilter.type = 'highpass'
      clickFilter.frequency.value = 900
      const isWideKey = letter === ' ' || letter === 'Enter'
      clickGain.gain.setValueAtTime(isWideKey ? 0.04 : 0.075, context.currentTime)
      clickGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
      click.connect(clickFilter)
      clickFilter.connect(clickGain)
      clickGain.connect(context.destination)

      const thock = context.createOscillator()
      const thockGain = context.createGain()
      thock.type = 'triangle'
      thock.frequency.setValueAtTime(isWideKey ? 105 : 145 + Math.random() * 20, context.currentTime)
      thock.frequency.exponentialRampToValueAtTime(80, context.currentTime + 0.035)
      thockGain.gain.setValueAtTime(isWideKey ? 0.045 : 0.03, context.currentTime)
      thockGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.04)
      thock.connect(thockGain)
      thockGain.connect(context.destination)

      click.start()
      thock.start()
      thock.stop(context.currentTime + 0.045)
      return
    }

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
  }, [mode, soundMode])

  const speakCharacter = useCallback((value: string) => {
    if (soundMode !== 'voice') return

    const character = value.toLocaleLowerCase('es-AR')
    if (!/^[a-zñáéíóúü0-9]$/.test(character)) return

    const filename = character === 'ñ'
      ? 'ñ'
      : character.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (!/^[a-zñ0-9]$/.test(filename)) return

    characterAudio.current?.pause()
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/characters/${filename}.mp3?v=7`)
    characterAudio.current = audio
    void audio.play().catch(() => undefined)
  }, [soundMode])

  const speakPracticePrompt = useCallback((value: string) => {
    practicePromptId.current += 1
    const promptId = practicePromptId.current
    practiceAudio.current?.pause()
    let targetStarted = false
    const filename = value.toLocaleLowerCase('es-AR')
    const targetAudio = new Audio(`${import.meta.env.BASE_URL}audio/characters/${encodeURIComponent(filename)}.mp3?v=7`)
    targetAudio.preload = 'auto'
    targetAudio.load()

    const playTargetAudio = () => {
      if (practicePromptId.current !== promptId || targetStarted) return
      targetStarted = true

      const startTargetAudio = () => {
        if (practicePromptId.current !== promptId) return
        targetAudio.currentTime = filename === 'o' ? 0.06 : 0.15
        practiceAudio.current = targetAudio
        void targetAudio.play().catch(() => undefined)
      }

      if (targetAudio.readyState >= HTMLMediaElement.HAVE_METADATA) startTargetAudio()
      else targetAudio.addEventListener('loadedmetadata', startTargetAudio, { once: true })
    }

    const promptFilename = /^\d$/.test(value) ? 'donde-esta-el-numero' : 'donde-esta-la-letra'
    const promptAudio = new Audio(`${import.meta.env.BASE_URL}audio/prompts/${promptFilename}.mp3?v=3`)
    practiceAudio.current = promptAudio
    promptAudio.onended = playTargetAudio
    promptAudio.onerror = playTargetAudio
    void promptAudio.play().catch(playTargetAudio)
  }, [])

  const playPracticePraise = useCallback(() => {
    const candidates = PRACTICE_PRAISES.filter((praise) => praise !== lastPracticePraise.current)
    const praise = candidates[Math.floor(Math.random() * candidates.length)]
    lastPracticePraise.current = praise
    practicePromptId.current += 1
    practiceAudio.current?.pause()

    const audio = new Audio(`${import.meta.env.BASE_URL}audio/praise/${praise}.mp3?v=1`)
    practiceAudio.current = audio
    void audio.play().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (mode !== 'repeat' || showSettings || showFullscreenHelp) {
      practicePromptId.current += 1
      practiceAudio.current?.pause()
      return
    }
    speakPracticePrompt(practiceTarget)
  }, [mode, practiceTarget, showSettings, showFullscreenHelp, speakPracticePrompt])

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
      size: 150 + Math.random() * 80,
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
      if (event.key === 'F11' && showFullscreenHelp) {
        finishFullscreenSetup()
        return
      }

      if (showSettings || event.target instanceof HTMLButtonElement) return
      const isBlocked = BLOCKED_KEYS.has(event.key) || event.ctrlKey || event.altKey || event.metaKey

      if (isBlocked) {
        const modifierKey = event.metaKey ? 'Meta' : event.altKey ? 'Alt' : event.ctrlKey ? 'Control' : event.key
        const allSpecialKeysUnlocked = (unlockedUntil.current.get('*') ?? 0) > performance.now()
        if (allSpecialKeysUnlocked || (unlockedUntil.current.get(modifierKey) ?? 0) > performance.now()) {
          if (event.key === 'F11') finishFullscreenSetup()
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

      if (mode === 'repeat') {
        if (event.repeat || practiceFeedback === 'correct') return
        if (event.key.length !== 1) return
        event.preventDefault()
        const answer = event.key.toLocaleUpperCase('es-AR')
        if (!PRACTICE_KEYS.includes(answer)) return
        if (answer === practiceTargetRef.current) {
          setPracticeFeedback('correct')
          setPracticeScore((current) => current + 1)
          addPop(answer)
          playPracticePraise()
          if (practiceTimer.current !== null) window.clearTimeout(practiceTimer.current)
          practiceTimer.current = window.setTimeout(() => {
            setPracticeFeedback('ready')
            setPracticeTarget((current) => choosePracticeKey(current))
          }, 1500)
        } else {
          setPracticeFeedback('wrong')
        }
        return
      }

      setHasStartedPlaying(true)

      if (event.key === 'Backspace') {
        event.preventDefault()
        if (mode === 'preschool') {
          setPops((current) => current.slice(0, -1))
          return
        }
        setText((current) => current.slice(0, -1))
        setLastKey('⌫')
        if (mode === 'writer') playNote('Backspace')
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
        playNote(mode === 'writer' ? 'Enter' : 'm')
        return
      }

      if (event.key.length === 1) {
        event.preventDefault()
        const typedValue = uppercaseOnly ? event.key.toLocaleUpperCase('es-AR') : event.key
        if (mode !== 'preschool') setText((current) => `${current}${typedValue}`.slice(-600))
        setLastKey(typedValue === ' ' ? 'espacio' : typedValue)
        addPop(typedValue)
        playNote(typedValue)
        speakCharacter(typedValue)
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
  }, [addPop, finishFullscreenSetup, mode, playNote, playPracticePraise, showFullscreenHelp, showSettings, speakCharacter, uppercaseOnly, practiceFeedback])

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
      if (active) finishFullscreenSetup()
    }

    detectBrowserFullscreen()
    window.addEventListener('resize', detectBrowserFullscreen)
    return () => window.removeEventListener('resize', detectBrowserFullscreen)
  }, [finishFullscreenSetup])

  const prepareFullscreen = (shouldReturnToSettings: boolean) => {
    unlockedUntil.current.set('F11', performance.now() + 7000)
    returnToSettingsAfterFullscreen.current = shouldReturnToSettings
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

  const closeApp = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    window.close()
    window.setTimeout(() => setCloseUnavailable(true), 250)
  }

  const changeMode = (nextMode: PlayMode) => {
    setMode(nextMode)
    setSoundType(nextMode === 'writer' ? 'tone' : 'voice')
    setSoundEnabled(nextMode === 'preschool' || nextMode === 'repeat')
    if (practiceTimer.current !== null) window.clearTimeout(practiceTimer.current)
    setPracticeFeedback('ready')
    setPracticeScore(0)
    setPracticeTarget(choosePracticeKey())
    setText('')
    setPops([])
    setLastKey(nextMode === 'words' ? (uppercaseOnly ? '¡HOLA!' : '¡Hola!') : '')
  }

  const clearPlayground = () => {
    if (mode === 'repeat') {
      if (practiceTimer.current !== null) window.clearTimeout(practiceTimer.current)
      setPracticeScore(0)
      setPracticeFeedback('ready')
      setPracticeTarget((current) => choosePracticeKey(current))
      return
    }
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

  const cycleSoundMode = () => {
    if (mode === 'writer') return
    setSoundType((current) => current === 'voice' ? 'tone' : 'voice')
  }
  const toggleSound = () => setSoundEnabled((current) => !current)

  const copy = MODE_COPY[mode]
  const sceneDecorations = SCENE_DECORATIONS[scene]
  const scenePattern = SCENE_PATTERNS[scene]
  const soundLabel = soundEnabled ? (soundType === 'voice' ? 'Voz' : 'Tonos') : 'Silencio'
  const nextSoundLabel = soundType === 'voice' ? 'tonos' : 'lectura de letras'

  return (
    <main className="app-shell">
      <div className="quick-controls" aria-label="Controles rápidos">
        <button
          type="button"
          className={uppercaseOnly ? 'quick-control active' : 'quick-control'}
          onClick={(event) => {
            toggleUppercase()
            event.currentTarget.blur()
            document.getElementById('playground')?.focus({ preventScroll: true })
          }}
          aria-pressed={uppercaseOnly}
          aria-label={uppercaseOnly ? 'Usar mayúsculas y minúsculas' : 'Usar solo mayúsculas'}
          title={uppercaseOnly ? 'Solo mayúsculas' : 'Mayúsculas y minúsculas'}
        >
          <span aria-hidden="true">{uppercaseOnly ? 'AA' : 'Aa'}</span>
        </button>
        <button
          type="button"
          className={soundMode !== 'off' ? 'quick-control sound-control active' : 'quick-control sound-control muted'}
          onClick={(event) => {
            toggleSound()
            event.currentTarget.blur()
            document.getElementById('playground')?.focus({ preventScroll: true })
          }}
          aria-label={soundEnabled ? `Silenciar ${soundLabel.toLowerCase()}` : `Activar ${soundType === 'voice' ? 'voz' : 'tonos'}`}
          title={`Audio: ${soundLabel}`}
        >
          <span aria-hidden="true">{soundType === 'voice' ? 'Aa' : '♫'}</span>
        </button>
        <button
          type="button"
          className="quick-control fullscreen-control"
          onClick={(event) => {
            prepareFullscreen(false)
            event.currentTarget.blur()
          }}
          aria-label="Activar pantalla completa con F11"
          title="Pantalla completa"
        >
          <span aria-hidden="true">↗</span>
        </button>
      </div>

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
          <span className="brand-mark" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}Tecladito.png`} alt="" />
          </span>
          <span>Tecladito</span>
        </a>

        <div className="status-pill" role="status">
          <span className="status-dot" />
          Teclas especiales protegidas
        </div>

        <div className="header-actions">
          <button className="icon-button" type="button" onClick={toggleSound} aria-label={soundEnabled ? 'Silenciar audio' : 'Activar audio'}>
            {soundEnabled ? (soundType === 'voice' ? 'Aa' : '♫') : '♩'}
          </button>
          <button className="fullscreen-button" type="button" onClick={() => prepareFullscreen(false)}>
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

      <section id="playground" tabIndex={-1} className={`playground playground-${mode} scene-${scene}`} aria-label={`Modo ${MODES.find((item) => item.id === mode)?.label}`}>
        <div className="decoration decoration-one" aria-hidden="true">{sceneDecorations[0]}</div>
        <div className="decoration decoration-two" aria-hidden="true">{sceneDecorations[1]}</div>
        <div className="decoration decoration-three" aria-hidden="true">{sceneDecorations[2]}</div>
        <div className="scene-pattern" aria-hidden="true">
          {scenePattern.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
        </div>
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

        {mode === 'preschool' && !hasStartedPlaying && (
          <div className="preschool-prompt" aria-live="polite">
            <span aria-hidden="true">A</span>
            <strong>¡Apretá una tecla!</strong>
            <small>Probá con letras, números o el espacio</small>
          </div>
        )}

        {mode === 'words' && (
          <>
            <div className={lastKey.length === 1 ? 'key-display' : 'key-display key-display-label'} aria-live="polite">{lastKey}</div>
            <div className="typed-paper">
              {text ? <span>{text}</span> : <span className="placeholder">Empezá a escribir…</span>}
              <span className="cursor" aria-hidden="true" />
            </div>
          </>
        )}

        {mode === 'repeat' && (
          <div className="practice-game" aria-live="polite">
            <div className="practice-score">Aciertos: {practiceScore}</div>
            <h2>¡Escuchá y buscá la tecla!</h2>
            <button type="button" className="practice-listen" onClick={(event) => {
              speakPracticePrompt(practiceTarget)
              event.currentTarget.blur()
              document.getElementById('playground')?.focus({ preventScroll: true })
            }} aria-label="Volver a escuchar la consigna">♫</button>
            <p>{practiceFeedback === 'correct' ? '¡Muy bien! ✨' : practiceFeedback === 'wrong' ? '¡Probá otra vez!' : 'Presioná la tecla que escuchaste'}</p>
            {practiceFeedback === 'correct' && <strong className="practice-answer">{practiceTarget}</strong>}
          </div>
        )}
        {mode === 'writer' && (
          <div ref={writerPaper} className="writer-paper" aria-live="polite">
            {text ? <span>{text}</span> : <span className="placeholder">Empezá a escribir…</span>}
            <span className="cursor" aria-hidden="true" />
          </div>
        )}

        <button className="clear-button" type="button" onClick={clearPlayground} disabled={mode !== 'repeat' && !text && !pops.length}>
          <span aria-hidden="true">↻</span> {mode === 'preschool' ? 'Limpiar las letras' : mode === 'repeat' ? 'Reiniciar juego' : 'Borrar y empezar de nuevo'}
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
        <button type="button" onClick={() => prepareFullscreen(false)}>{isFullscreen ? 'Salir con F11' : 'Activar pantalla completa'}</button>
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

            <div className="settings-section">
              <h3>Elegí un fondo</h3>
              <div className="scene-picker">
                {SCENES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={scene === item.id ? `scene-option scene-preview-${item.id} active` : `scene-option scene-preview-${item.id}`}
                    onClick={() => setScene(item.id)}
                    aria-pressed={scene === item.id}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-section settings-controls">
              <div className="audio-setting">
                {mode === 'writer' ? (
                  <div className="audio-mode-label">
                    <span aria-hidden="true">♫</span>
                    <span><strong>Audio: Tonos</strong><small>Sonidos de teclado</small></span>
                  </div>
                ) : (
                  <button type="button" className="audio-mode-button" onClick={cycleSoundMode}>
                    <span aria-hidden="true">{soundType === 'voice' ? 'Aa' : '♫'}</span>
                    <span><strong>Audio: {soundType === 'voice' ? 'Lectura de letras' : 'Tonos'}</strong><small>Cambiar a {nextSoundLabel}</small></span>
                  </button>
                )}
                <button
                  type="button"
                  className={soundEnabled ? 'switch on' : 'switch'}
                  onClick={toggleSound}
                  role="switch"
                  aria-checked={soundEnabled}
                  aria-label={soundEnabled ? 'Silenciar audio' : 'Activar audio'}
                />
              </div>
              <button type="button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-pressed={theme === 'dark'}>
                <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
                <span><strong>Modo oscuro</strong><small>{theme === 'dark' ? 'Activado' : 'Desactivado'}</small></span>
                <i className={theme === 'dark' ? 'switch on' : 'switch'} aria-hidden="true" />
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
              <button className="fullscreen-setting" type="button" onClick={() => prepareFullscreen(true)}>
                <span aria-hidden="true">↗</span>
                <span><strong>Activar pantalla completa</strong><small>Prepara la tecla F11</small></span>
                <b aria-hidden="true">›</b>
              </button>
            </div>

            <div className="settings-security">
              <span aria-hidden="true">✓</span>
              <p><strong>Protección activa</strong> Mantené cualquier tecla especial durante 3 segundos para habilitarlas todas por 5 segundos.</p>
            </div>

            {!isFirstSetup && (
              <button className="close-app-button" type="button" onClick={closeApp}>
                <span aria-hidden="true">×</span> Cerrar Tecladito
              </button>
            )}

            {closeUnavailable && (
              <p className="close-app-help" role="status">
                {isFullscreen
                  ? <>Para salir de pantalla completa y cerrar Tecladito, usá <strong>Alt + F4</strong>.</>
                  : <>El navegador no permite cerrar esta pestaña automáticamente. Usá <strong>Alt + F4</strong>.</>}
              </p>
            )}

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
            <button type="button" onClick={finishFullscreenSetup} aria-label="Cerrar indicación">×</button>
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
