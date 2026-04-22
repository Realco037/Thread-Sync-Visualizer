import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationEngine } from '../hooks/useSimulationEngine'
import Controls from './Controls'
import LogBox from './LogBox'

const N = 5  // number of philosophers

// ── Geometry helpers ─────────────────────────────────────
const TWO_PI = Math.PI * 2
const angle  = (i, total, offsetDeg = -90) =>
  (offsetDeg * Math.PI) / 180 + (TWO_PI * i) / total

const polarToXY = (cx, cy, r, a) => ({
  x: cx + r * Math.cos(a),
  y: cy + r * Math.sin(a),
})

// ── State machine constants ──────────────────────────────
const THINKING = 'thinking'
const HUNGRY   = 'hungry'
const EATING   = 'eating'

const STATE_COLOR = {
  [THINKING]: '#64748b',
  [HUNGRY]:   '#ffb700',
  [EATING]:   '#00ff88',
}

const STATE_GLOW = {
  [THINKING]: 'none',
  [HUNGRY]:   '0 0 12px rgba(255,183,0,0.6)',
  [EATING]:   '0 0 16px rgba(0,255,136,0.7)',
}

function makeSim() {
  const philosophers = Array.from({ length: N }, (_, i) => ({
    id: i,
    state: THINKING,
    timer: Math.random() * 2 + 1,
    progress: 0,
  }))
  // forks[i] — fork between philosopher i and (i+1)%N; null means free, otherwise owned by philosopher index
  const forks = Array(N).fill(null)
  return { philosophers, forks }
}

// ── Circular table SVG component ─────────────────────────
function CircularTable({ philosophers, forks }) {
  const SIZE  = 440
  const CX    = SIZE / 2
  const CY    = SIZE / 2
  const PR    = 148  // philosopher orbit radius
  const FR    = 88   // fork orbit radius
  const PRAD  = 32   // philosopher node radius
  const FRAD  = 13   // fork circle radius

  return (
    <svg
      width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="select-none flex-none"
      style={{ filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.8))' }}
    >
      {/* Table surface */}
      <circle cx={CX} cy={CY} r={72} fill="rgba(13,20,36,0.9)"
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <text x={CX} y={CY + 4} textAnchor="middle" fontSize="9"
            fill="#334155" fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>
        TABLE
      </text>

      {/* Connection lines (dashed) — philosopher to adjacent forks */}
      {philosophers.map((p, i) => {
        const pa = angle(i, N)
        const pPos = polarToXY(CX, CY, PR, pa)
        // left fork (i) and right fork ((i+N-1)%N)
        return [i, (i + N - 1) % N].map(fi => {
          const fa = angle(fi, N, -90 + (360 / N) / 2)
          const fPos = polarToXY(CX, CY, FR, fa)
          const isAcquired = forks[fi] === i
          return (
            <line
              key={`${i}-${fi}`}
              x1={pPos.x} y1={pPos.y} x2={fPos.x} y2={fPos.y}
              stroke={isAcquired ? STATE_COLOR[EATING] : 'rgba(255,255,255,0.07)'}
              strokeWidth={isAcquired ? 1.5 : 1}
              strokeDasharray={isAcquired ? '0' : '3 3'}
              opacity={isAcquired ? 0.8 : 0.4}
            />
          )
        })
      })}

      {/* Fork circles */}
      {Array.from({ length: N }, (_, i) => {
        const fa   = angle(i, N, -90 + (360 / N) / 2)
        const fPos = polarToXY(CX, CY, FR, fa)
        const owner = forks[i]
        const isFree = owner === null
        return (
          <g key={`fork-${i}`}>
            <circle
              cx={fPos.x} cy={fPos.y} r={FRAD}
              fill={isFree ? 'rgba(255,255,255,0.06)' : 'rgba(0,255,136,0.15)'}
              stroke={isFree ? 'rgba(255,255,255,0.15)' : 'rgba(0,255,136,0.6)'}
              strokeWidth={isFree ? 1 : 1.5}
            />
            {/* Fork icon — simple utensil glyph */}
            <text x={fPos.x} y={fPos.y + 4.5} textAnchor="middle" fontSize="11"
                  fill={isFree ? '#475569' : '#00ff88'} fontFamily="sans-serif">
              {isFree ? '⋯' : '✕'}
            </text>
            {/* Fork index */}
            <text x={fPos.x} y={fPos.y + FRAD + 11} textAnchor="middle" fontSize="9"
                  fill="#334155" fontFamily="JetBrains Mono, monospace">
              F{i}
            </text>
          </g>
        )
      })}

      {/* Philosopher nodes */}
      {philosophers.map((p, i) => {
        const pa   = angle(i, N)
        const pPos = polarToXY(CX, CY, PR, pa)
        const col  = STATE_COLOR[p.state]

        return (
          <g key={`phil-${i}`}>
            {/* Glow ring for eating state */}
            {p.state === EATING && (
              <circle
                cx={pPos.x} cy={pPos.y} r={PRAD + 4}
                fill="none"
                stroke="rgba(0,255,136,0.25)"
                strokeWidth="6"
              />
            )}
            {p.state === HUNGRY && (
              <circle
                cx={pPos.x} cy={pPos.y} r={PRAD + 3}
                fill="none"
                stroke="rgba(255,183,0,0.2)"
                strokeWidth="4"
              />
            )}

            {/* Background circle */}
            <circle
              cx={pPos.x} cy={pPos.y} r={PRAD}
              fill={
                p.state === EATING   ? 'rgba(0,255,136,0.12)'  :
                p.state === HUNGRY   ? 'rgba(255,183,0,0.1)'   :
                'rgba(255,255,255,0.04)'
              }
              stroke={col}
              strokeWidth={p.state !== THINKING ? 2 : 1}
              strokeOpacity={p.state !== THINKING ? 0.8 : 0.3}
            />

            {/* Progress arc */}
            {p.state === EATING && (() => {
              const r2 = PRAD - 3
              const frac = Math.min(1, p.progress / 100)
              const sweep = frac * TWO_PI - 0.001
              const startX = pPos.x + r2 * Math.cos(-Math.PI / 2)
              const startY = pPos.y + r2 * Math.sin(-Math.PI / 2)
              const endX   = pPos.x + r2 * Math.cos(-Math.PI / 2 + sweep)
              const endY   = pPos.y + r2 * Math.sin(-Math.PI / 2 + sweep)
              const large  = sweep > Math.PI ? 1 : 0
              return (
                <path
                  d={`M ${startX} ${startY} A ${r2} ${r2} 0 ${large} 1 ${endX} ${endY}`}
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              )
            })()}

            {/* Philosopher emoji */}
            <text x={pPos.x} y={pPos.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize="17">
              {p.state === EATING ? '😋' : p.state === HUNGRY ? '😤' : '🤔'}
            </text>

            {/* Label */}
            <text
              x={pPos.x} y={pPos.y + PRAD + 13}
              textAnchor="middle" fontSize="10"
              fill={col} fontFamily="JetBrains Mono, monospace"
              opacity={p.state !== THINKING ? 1 : 0.5}
            >
              P{i}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Legend row ────────────────────────────────────────────
function PhilLegend({ philosophers }) {
  const counts = {
    [THINKING]: philosophers.filter(p => p.state === THINKING).length,
    [HUNGRY]:   philosophers.filter(p => p.state === HUNGRY).length,
    [EATING]:   philosophers.filter(p => p.state === EATING).length,
  }
  const emojis = { [THINKING]: '🤔', [HUNGRY]: '😤', [EATING]: '😋' }
  return (
    <div className="flex gap-4 flex-wrap">
      {[THINKING, HUNGRY, EATING].map(s => (
        <div key={s} className="flex items-center gap-2">
          <span className="text-sm">{emojis[s]}</span>
          <span className="text-xs font-mono capitalize" style={{ color: STATE_COLOR[s] }}>{s}</span>
          <span className="text-xs font-mono text-slate-600">×{counts[s]}</span>
        </div>
      ))}
    </div>
  )
}

// ── Philosopher state cards ───────────────────────────────
function PhilCard({ philosopher, leftFork, rightFork }) {
  const s = philosopher.state
  const col = STATE_COLOR[s]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        background: s === EATING ? 'rgba(0,255,136,0.07)' : s === HUNGRY ? 'rgba(255,183,0,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${col}${s === THINKING ? '30' : '55'}`,
        boxShadow: STATE_GLOW[s],
      }}
      className="rounded-xl p-3 relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${col}55, transparent)` }} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">
          {s === EATING ? '😋' : s === HUNGRY ? '😤' : '🤔'}
        </span>
        <span className="text-xs font-mono font-semibold text-slate-200">P{philosopher.id}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={s}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[10px] font-mono font-semibold uppercase tracking-widest ml-auto"
            style={{ color: col }}
          >
            {s}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Fork status */}
      <div className="flex gap-1.5 mb-2">
        {[
          { label: `F${philosopher.id}`, held: leftFork === philosopher.id },
          { label: `F${(philosopher.id + N - 1) % N}`, held: rightFork === philosopher.id },
        ].map(f => (
          <span key={f.label}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: f.held ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              color: f.held ? '#00ff88' : '#475569',
              border: `1px solid ${f.held ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            {f.label} {f.held ? '●' : '○'}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      {s === EATING && (
        <div className="h-1 rounded-full overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }}
            animate={{ width: `${Math.min(100, philosopher.progress)}%` }}
            transition={{ duration: 0.25, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────
export default function DiningPhilosophers() {
  const [philosophers, setPhilosophers] = useState(() => makeSim().philosophers)
  const [forks, setForks]               = useState(() => makeSim().forks)
  const [log, setLog]                   = useState([])

  const stateRef = useRef(makeSim())

  const addLog = useCallback((msg, cls = '') => {
    const t = (performance.now() / 1000).toFixed(1)
    setLog(prev => [...prev.slice(-60), { t, msg, cls }])
  }, [])

  const syncUI = useCallback(() => {
    const s = stateRef.current
    setPhilosophers(s.philosophers.map(p => ({ ...p })))
    setForks([...s.forks])
  }, [])

  const tick = useCallback((sp) => {
    const s = stateRef.current

    s.philosophers.forEach(p => {
      p.timer -= 0.3 * sp

      if (p.timer <= 0) {
        if (p.state === THINKING) {
          // Become hungry — try to pick up forks
          p.state = HUNGRY
          p.timer = 0.3
          addLog(`P${p.id} is hungry`, 'amber')

        } else if (p.state === HUNGRY) {
          // Try to acquire both adjacent forks (left=id, right=(id+N-1)%N)
          const leftFork  = p.id
          const rightFork = (p.id + N - 1) % N

          if (s.forks[leftFork] === null && s.forks[rightFork] === null) {
            s.forks[leftFork]  = p.id
            s.forks[rightFork] = p.id
            p.state    = EATING
            p.progress = 0
            p.timer    = 1.8 + Math.random() * 2
            addLog(`P${p.id} picks up F${leftFork} + F${rightFork} → eating 🍝`, 'green')
          } else {
            // At least one fork busy — stay hungry, try again soon
            const blockedBy = [leftFork, rightFork]
              .filter(fi => s.forks[fi] !== null && s.forks[fi] !== p.id)
              .map(fi => `F${fi} held by P${s.forks[fi]}`)
              .join(', ')
            if (blockedBy) addLog(`P${p.id} waiting — ${blockedBy}`, 'red')
            p.timer = 0.5 + Math.random() * 0.5  // back-off to reduce livelock
          }

        } else if (p.state === EATING) {
          // Done eating — put forks down and go back to thinking
          const leftFork  = p.id
          const rightFork = (p.id + N - 1) % N
          s.forks[leftFork]  = null
          s.forks[rightFork] = null
          p.state    = THINKING
          p.progress = 0
          p.timer    = 1.5 + Math.random() * 2
          addLog(`P${p.id} done eating → thinking 💭`, 'blue')
        }
      }

      if (p.state === EATING) p.progress = Math.min(100, p.progress + 3 * sp)
    })

    syncUI()
  }, [addLog, syncUI])

  const doReset = useCallback(() => {
    const fresh = makeSim()
    stateRef.current = fresh
    setPhilosophers(fresh.philosophers.map(p => ({ ...p })))
    setForks([...fresh.forks])
    setLog([])
  }, [])

  const { running, paused, speed, start, pause, resume, reset, setSpeed } =
    useSimulationEngine({ onTick: tick, onReset: doReset })

  const handlePause = () => paused ? resume() : pause()

  const forksUI = forks  // snapshot for rendering

  return (
    <div className="min-h-full overflow-y-auto px-8 py-8">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white mb-2">Dining Philosophers Problem</h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Five philosophers sit around a table. Each needs <em>both</em> adjacent forks (mutexes) to eat.
          Watch for contention, starvation hints, and the back-off strategy that prevents livelock.
        </p>
      </div>

      <Controls
        running={running} paused={paused} speed={speed}
        onStart={start} onPause={handlePause} onReset={reset} onSpeed={setSpeed}
        className="mb-5"
      />

      {/* Main layout */}
      <div className="flex gap-6 flex-wrap items-start mb-5">
        {/* Circular table */}
        <div className="glass rounded-2xl p-5 flex flex-col items-center gap-4">
          <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest self-start">
            Circular Table
          </div>
          <CircularTable philosophers={philosophers} forks={forksUI} />
          <PhilLegend philosophers={philosophers} />
        </div>

        {/* Right panel — fork status + cards */}
        <div className="flex-1 min-w-72 space-y-4">
          {/* Fork ownership table */}
          <div className="glass rounded-xl p-4">
            <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Fork Ownership
            </div>
            <div className="grid grid-cols-5 gap-2">
              {forksUI.map((owner, i) => (
                <motion.div
                  key={i}
                  layout
                  animate={{
                    background: owner !== null ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                    borderColor: owner !== null ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)',
                    boxShadow: owner !== null ? '0 0 8px rgba(0,255,136,0.25)' : 'none',
                  }}
                  transition={{ duration: 0.25 }}
                  className="rounded-lg border p-2 flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] font-mono text-slate-600">F{i}</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={owner ?? 'free'}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-mono font-semibold"
                      style={{ color: owner !== null ? '#00ff88' : '#334155' }}
                    >
                      {owner !== null ? `P${owner}` : '—'}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Philosopher cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <AnimatePresence>
              {philosophers.map(p => (
                <PhilCard
                  key={p.id}
                  philosopher={p}
                  leftFork={forksUI[p.id]}
                  rightFork={forksUI[(p.id + N - 1) % N]}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <LogBox entries={log} />
    </div>
  )
}
