import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationEngine } from '../hooks/useSimulationEngine'
import Controls from './Controls'
import ThreadCard from './ThreadCard'
import LogBox from './LogBox'

function makeThreads(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i, label: `T${i}`, state: 'waiting', progress: 0,
    timer: Math.random() * 2 + 0.3,
  }))
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

export default function SemaphoreSection() {
  const [threadCount, setThreadCount] = useState(4)
  const [capacity, setCapacity] = useState(2)
  const [threads, setThreads] = useState(() => makeThreads(4))
  const [slots, setSlots] = useState(2)
  const [queue, setQueue] = useState([])
  const [log, setLog] = useState([])

  const stateRef = useRef({ slots: 2, queue: [], threads: makeThreads(4) })

  const addLog = useCallback((msg, cls = '') => {
    const t = (performance.now() / 1000).toFixed(1)
    setLog(prev => [...prev.slice(-60), { t, msg, cls }])
  }, [])

  const syncUI = useCallback(() => {
    const s = stateRef.current
    setSlots(s.slots)
    setQueue([...s.queue])
    setThreads(s.threads.map(t => ({ ...t })))
  }, [])

  const tick = useCallback((sp) => {
    const s = stateRef.current
    s.threads.forEach(th => {
      th.timer -= 0.3 * sp
      if (th.timer <= 0) {
        if (th.state === 'running') {
          th.state = 'waiting'; th.progress = 0
          s.slots++
          addLog(`T${th.id} released slot → semaphore = ${s.slots}`, 'green')
          const nextId = s.queue.shift()
          if (nextId !== undefined) {
            const nth = s.threads[nextId]
            nth.state = 'running'; nth.progress = 0
            s.slots--; nth.timer = 1.5 + Math.random() * 2
            addLog(`T${nextId} dequeued → running (sem=${s.slots})`, 'blue')
          }
          th.timer = 1 + Math.random() * 2
        } else if (th.state === 'waiting') {
          if (s.slots > 0) {
            th.state = 'running'; th.progress = 0
            s.slots--; th.timer = 1.5 + Math.random() * 2
            addLog(`T${th.id} acquired slot → semaphore = ${s.slots}`, 'blue')
          } else {
            th.state = 'blocked'
            if (!s.queue.includes(th.id)) {
              s.queue.push(th.id)
              addLog(`T${th.id} blocked — queued (sem=0)`, 'red')
            }
            th.timer = 0.5
          }
        } else {
          th.timer = 0.4
        }
      }
      if (th.state === 'running') th.progress = Math.min(100, th.progress + 3 * sp)
    })
    syncUI()
  }, [addLog, syncUI])

  const doReset = useCallback((tc, cap) => {
    const th = makeThreads(tc)
    stateRef.current = { slots: cap, queue: [], threads: th }
    setSlots(cap); setQueue([])
    setThreads(th.map(t => ({ ...t }))); setLog([])
  }, [])

  const { running, paused, speed, start, pause, resume, reset, setSpeed } =
    useSimulationEngine({
      onTick: tick,
      onReset: () => doReset(threadCount, capacity),
    })

  const handlePause  = () => paused ? resume() : pause()
  const handleTCChange = e => {
    const tc = parseInt(e.target.value); setThreadCount(tc); reset(); doReset(tc, capacity)
  }
  const handleCapChange = e => {
    const cap = parseInt(e.target.value); setCapacity(cap); reset(); doReset(threadCount, cap)
  }

  return (
    <div className="min-h-full overflow-y-auto px-8 py-8">
      {/* Section header */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white mb-2">Counting Semaphore</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          A semaphore with value <span className="font-mono text-slate-300">N</span> allows up to N threads to run concurrently.
          Threads exceeding the limit are queued and blocked until a slot is freed via{' '}
          <code className="font-mono text-neon-purple" style={{ color: '#a855f7' }}>signal()</code>.
        </p>
      </div>

      <Controls
        running={running} paused={paused} speed={speed}
        onStart={start} onPause={handlePause} onReset={reset} onSpeed={setSpeed}
        className="mb-6"
      >
        <SelectInput label="Threads" value={threadCount} onChange={handleTCChange} options={[2,3,4,5,6,8,10]} />
        <SelectInput label="Capacity" value={capacity} onChange={handleCapChange} options={[1,2,3,4]} />
      </Controls>

      {/* Semaphore state panel */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-widest mb-5">
          Semaphore State
        </div>
        <div className="flex flex-wrap gap-8 items-start">
          {/* Slots */}
          <div>
            <div className="text-sm text-slate-400 mb-3">
              Available Slots —{' '}
              <span className="font-mono" style={{ color: '#00ff88' }}>{slots}</span>
              <span className="text-slate-600"> / {capacity}</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: capacity }, (_, i) => (
                <motion.div
                  key={i}
                  layout
                  animate={{
                    background: i < slots ? 'rgba(255,255,255,0.06)' : 'rgba(0,255,136,0.12)',
                    borderColor: i < slots ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,136,0.4)',
                    boxShadow: i < slots ? 'none' : '0 0 8px rgba(0,255,136,0.3)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-14 h-14 rounded-xl border flex items-center justify-center text-lg font-mono"
                  style={{ color: i < slots ? '#475569' : '#00ff88' }}
                >
                  {i < slots ? '○' : '✓'}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Queue */}
          <div className="flex-1 min-w-40">
            <div className="text-sm text-slate-400 mb-3">
              Wait Queue — <span className="font-mono" style={{ color: '#ff3366' }}>{queue.length} blocked</span>
            </div>
            <div className="flex gap-2 flex-wrap min-h-10 items-center">
              <AnimatePresence>
                {queue.length === 0
                  ? <span className="text-xs text-slate-700 italic">empty</span>
                  : queue.map(id => (
                    <motion.span
                      key={id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      className="badge badge-blocked"
                    >
                      T{id}
                    </motion.span>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Thread grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        <AnimatePresence>
          {threads.map(th => <ThreadCard key={th.id} thread={th} />)}
        </AnimatePresence>
      </div>

      <LogBox entries={log} />
    </div>
  )
}
