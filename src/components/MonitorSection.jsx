import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationEngine } from '../hooks/useSimulationEngine'
import Controls from './Controls'
import ThreadCard from './ThreadCard'
import LogBox from './LogBox'

const BUFFER_CAP = 4

function makeThreads(np, nc) {
  const threads = []
  for (let i = 0; i < np; i++)
    threads.push({ id: i, label: `P${i}`, role: 'P', state: 'waiting', progress: 0, timer: Math.random() * 2 + 0.5 })
  for (let i = 0; i < nc; i++)
    threads.push({ id: np + i, label: `C${i}`, role: 'C', state: 'waiting', progress: 0, timer: Math.random() * 2 + 0.5 })
  return threads
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 font-mono uppercase tracking-widest">{label}</span>
      <select
        value={value} onChange={onChange}
        className="text-sm font-mono rounded-lg px-3 py-1.5 border outline-none cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0',
        }}
      >
        {options.map(n => <option key={n} value={n} style={{ background: '#0d1424' }}>{n}</option>)}
      </select>
    </div>
  )
}

export default function MonitorSection() {
  const [prodCount, setProdCount] = useState(2)
  const [consCount, setConsCount] = useState(2)
  const [threads, setThreads] = useState(() => makeThreads(2, 2))
  const [buffer, setBuffer] = useState([])
  const [lockState, setLockState] = useState({ locked: false, owner: -1 })
  const [notFullQ, setNotFullQ] = useState([])
  const [notEmptyQ, setNotEmptyQ] = useState([])
  const [log, setLog] = useState([])

  const stateRef = useRef({
    locked: false, owner: -1, buffer: [], notFullQ: [], notEmptyQ: [], threads: makeThreads(2, 2),
  })

  const addLog = useCallback((msg, cls = '') => {
    const t = (performance.now() / 1000).toFixed(1)
    setLog(prev => [...prev.slice(-60), { t, msg, cls }])
  }, [])

  const syncUI = useCallback(() => {
    const s = stateRef.current
    setBuffer([...s.buffer])
    setLockState({ locked: s.locked, owner: s.owner })
    setNotFullQ([...s.notFullQ])
    setNotEmptyQ([...s.notEmptyQ])
    setThreads(s.threads.map(t => ({ ...t })))
  }, [])

  const tick = useCallback((sp) => {
    const s = stateRef.current
    s.threads.forEach(th => {
      th.timer -= 0.3 * sp
      if (th.timer <= 0) {
        if (th.state === 'running') {
          if (th.role === 'P') {
            const item = Math.floor(Math.random() * 90) + 10
            s.buffer.push(item)
            addLog(`${th.label} produced ${item} → buffer [${s.buffer.length}/${BUFFER_CAP}]`, 'green')
            if (s.notEmptyQ.length > 0) {
              const wid = s.notEmptyQ.shift()
              const wth = s.threads[wid]
              wth.state = 'running'; wth.timer = 1.5 + Math.random()
              addLog(`signal(notEmpty) → woke ${wth.label}`, 'blue')
            }
          } else {
            const item = s.buffer.shift()
            addLog(`${th.label} consumed ${item} ← buffer [${s.buffer.length}/${BUFFER_CAP}]`, 'amber')
            if (s.notFullQ.length > 0) {
              const wid = s.notFullQ.shift()
              const wth = s.threads[wid]
              wth.state = 'running'; wth.timer = 1.5 + Math.random()
              addLog(`signal(notFull) → woke ${wth.label}`, 'blue')
            }
          }
          th.state = 'waiting'; th.progress = 0
          s.locked = false; s.owner = -1
          th.timer = 1 + Math.random() * 1.5
        } else if (th.state === 'waiting') {
          if (!s.locked) {
            s.locked = true; s.owner = th.id
            if (th.role === 'P') {
              if (s.buffer.length >= BUFFER_CAP) {
                th.state = 'blocked'
                s.notFullQ.push(th.id)
                s.locked = false; s.owner = -1
                addLog(`${th.label} wait(notFull) — buffer full`, 'red')
                th.timer = 0.4
              } else {
                th.state = 'running'; th.progress = 0; th.timer = 0.8 + Math.random()
              }
            } else {
              if (s.buffer.length === 0) {
                th.state = 'blocked'
                s.notEmptyQ.push(th.id)
                s.locked = false; s.owner = -1
                addLog(`${th.label} wait(notEmpty) — buffer empty`, 'red')
                th.timer = 0.4
              } else {
                th.state = 'running'; th.progress = 0; th.timer = 0.8 + Math.random()
              }
            }
          } else {
            th.timer = 0.4
          }
        } else {
          th.timer = 0.4
        }
      }
      if (th.state === 'running') th.progress = Math.min(100, th.progress + 3 * sp)
    })
    syncUI()
  }, [addLog, syncUI])

  const doReset = useCallback((np, nc) => {
    const th = makeThreads(np, nc)
    stateRef.current = { locked: false, owner: -1, buffer: [], notFullQ: [], notEmptyQ: [], threads: th }
    setBuffer([]); setLockState({ locked: false, owner: -1 })
    setNotFullQ([]); setNotEmptyQ([])
    setThreads(th.map(t => ({ ...t }))); setLog([])
  }, [])

  const { running, paused, speed, start, pause, resume, reset, setSpeed } =
    useSimulationEngine({
      onTick: tick,
      onReset: () => doReset(prodCount, consCount),
    })

  const handlePause    = () => paused ? resume() : pause()
  const handleProdChange = e => { const v = parseInt(e.target.value); setProdCount(v); reset(); doReset(v, consCount) }
  const handleConsChange = e => { const v = parseInt(e.target.value); setConsCount(v); reset(); doReset(prodCount, v) }

  const bufFill = buffer.length / BUFFER_CAP

  return (
    <div className="min-h-full overflow-y-auto px-8 py-8">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white mb-2">Monitor — Bounded Buffer</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          A monitor wraps shared state, a mutex, and condition variables. Producers call{' '}
          <code className="font-mono" style={{ color: '#a855f7' }}>wait(notFull)</code> when the buffer is full;
          consumers call <code className="font-mono" style={{ color: '#a855f7' }}>wait(notEmpty)</code> when empty.
        </p>
      </div>

      <Controls
        running={running} paused={paused} speed={speed}
        onStart={start} onPause={handlePause} onReset={reset} onSpeed={setSpeed}
        className="mb-5"
      >
        <SelectInput label="Producers" value={prodCount} onChange={handleProdChange} options={[1,2,3,4]} />
        <SelectInput label="Consumers" value={consCount} onChange={handleConsChange} options={[1,2,3,4]} />
      </Controls>

      {/* Monitor glass box */}
      <div className="glass rounded-xl overflow-hidden mb-5">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3"
             style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
            Monitor · Bounded Buffer · cap: {BUFFER_CAP}
          </span>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={lockState.locked ? 'locked' : 'free'}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`badge ${lockState.locked ? 'badge-blocked' : 'badge-running'}`}
              >
                {lockState.locked
                  ? `Locked · ${threads.find(t => t.id === lockState.owner)?.label ?? '?'}`
                  : 'Lock free'}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs font-mono text-slate-500">
              <span style={{ color: '#00ff88' }}>{buffer.length}</span>
              <span className="text-slate-700"> / {BUFFER_CAP}</span>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Buffer cells */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest w-16">Buffer</span>
            <div className="flex gap-3">
              {Array.from({ length: BUFFER_CAP }, (_, i) => (
                <motion.div
                  key={i}
                  layout
                  animate={{
                    background: i < buffer.length ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: i < buffer.length ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)',
                    boxShadow: i < buffer.length ? '0 0 8px rgba(0,255,136,0.25)' : 'none',
                  }}
                  transition={{ duration: 0.25 }}
                  className="w-16 h-16 rounded-xl border flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={i < buffer.length ? buffer[i] : 'empty'}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18 }}
                      className="text-base font-mono font-semibold"
                      style={{ color: i < buffer.length ? '#00ff88' : '#334155' }}
                    >
                      {i < buffer.length ? buffer[i] : '—'}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Condition variable rows */}
          {[
            { label: 'notFull',  q: notFullQ,  fill: 1 - bufFill, color: '#a855f7', warnFull: bufFill >= 1 },
            { label: 'notEmpty', q: notEmptyQ, fill: bufFill,      color: '#00b4ff', warnFull: bufFill === 0 },
          ].map(cv => (
            <div key={cv.label} className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest w-18">{cv.label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden"
                   style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.round(cv.fill * 100)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    background: cv.warnFull ? '#ff3366' : cv.color,
                    boxShadow: `0 0 6px ${cv.warnFull ? 'rgba(255,51,102,0.5)' : cv.color + '80'}`,
                  }}
                />
              </div>
              <div className="flex gap-1.5 min-w-20">
                <AnimatePresence>
                  {cv.q.length === 0
                    ? <span className="text-xs text-slate-700 italic">—</span>
                    : cv.q.map(id => (
                      <motion.span
                        key={id}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="badge badge-blocked"
                      >
                        {threads[id]?.label}
                      </motion.span>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        <AnimatePresence>
          {threads.map(th => (
            <ThreadCard
              key={th.id} thread={th}
              isOwner={lockState.locked && th.id === lockState.owner}
              badge={th.role === 'P' ? 'producer' : 'consumer'}
            />
          ))}
        </AnimatePresence>
      </div>

      <LogBox entries={log} />
    </div>
  )
}
