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

export default function MutexSection() {
  const [threadCount, setThreadCount] = useState(5)
  const [threads, setThreads] = useState(() => makeThreads(5))
  const [lockState, setLockState] = useState({ locked: false, owner: -1 })
  const [queue, setQueue] = useState([])
  const [log, setLog] = useState([])

  const stateRef = useRef({ locked: false, owner: -1, queue: [], threads: makeThreads(5) })

  const addLog = useCallback((msg, cls = '') => {
    const t = (performance.now() / 1000).toFixed(1)
    setLog(prev => [...prev.slice(-60), { t, msg, cls }])
  }, [])

  const syncUI = useCallback(() => {
    const s = stateRef.current
    setLockState({ locked: s.locked, owner: s.owner })
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
          s.locked = false; s.owner = -1
          addLog(`T${th.id} released mutex`, 'green')
          if (s.queue.length > 0) {
            const nid = s.queue.shift()
            const nth = s.threads[nid]
            s.locked = true; s.owner = nid
            nth.state = 'running'; nth.progress = 0
            nth.timer = 1.5 + Math.random() * 2
            addLog(`T${nid} acquired mutex (FIFO wake)`, 'blue')
          }
          th.timer = 1 + Math.random() * 1.5
        } else if (th.state === 'waiting') {
          if (!s.locked) {
            s.locked = true; s.owner = th.id
            th.state = 'running'; th.progress = 0
            th.timer = 1.5 + Math.random() * 2
            addLog(`T${th.id} acquired mutex (lock free)`, 'blue')
          } else {
            th.state = 'blocked'
            if (!s.queue.includes(th.id)) {
              s.queue.push(th.id)
              addLog(`T${th.id} blocked — owner: T${s.owner}`, 'red')
            }
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

  const doReset = useCallback((tc) => {
    const th = makeThreads(tc)
    stateRef.current = { locked: false, owner: -1, queue: [], threads: th }
    setLockState({ locked: false, owner: -1 })
    setQueue([]); setThreads(th.map(t => ({ ...t }))); setLog([])
  }, [])

  const { running, paused, speed, start, pause, resume, reset, setSpeed } =
    useSimulationEngine({
      onTick: tick,
      onReset: () => doReset(threadCount),
    })

  const handlePause    = () => paused ? resume() : pause()
  const handleTCChange = e => {
    const tc = parseInt(e.target.value); setThreadCount(tc); reset(); doReset(tc)
  }

  return (
    <div className="min-h-full overflow-y-auto px-8 py-8">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white mb-2">Mutex — Mutual Exclusion Lock</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          A mutex ensures only one thread holds the lock at a time.
          All contenders are blocked in a FIFO queue until the owner calls{' '}
          <code className="font-mono" style={{ color: '#a855f7' }}>unlock()</code>.
        </p>
      </div>

      <Controls
        running={running} paused={paused} speed={speed}
        onStart={start} onPause={handlePause} onReset={reset} onSpeed={setSpeed}
        className="mb-5"
      >
        <SelectInput label="Threads" value={threadCount} onChange={handleTCChange} options={[2,3,4,5,6,8,10]} />
      </Controls>

      {/* Mutex state panel */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-widest mb-5">
          Mutex State
        </div>
        <div className="flex flex-wrap items-center gap-8">
          {/* Lock indicator */}
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                filter: lockState.locked
                  ? 'drop-shadow(0 0 8px rgba(255,51,102,0.7))'
                  : 'drop-shadow(0 0 8px rgba(0,255,136,0.7))',
              }}
              transition={{ duration: 0.3 }}
              className="text-5xl select-none"
            >
              {lockState.locked ? '🔒' : '🔓'}
            </motion.div>
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={lockState.locked ? 'locked' : 'free'}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-base font-semibold font-mono"
                  style={{ color: lockState.locked ? '#ff3366' : '#00ff88' }}
                >
                  {lockState.locked ? 'LOCKED' : 'UNLOCKED'}
                </motion.div>
              </AnimatePresence>
              <div className="text-sm text-slate-500 mt-1">
                {lockState.locked
                  ? <span>Owner: <span className="font-mono text-neon-blue" style={{ color: '#00b4ff' }}>T{lockState.owner}</span></span>
                  : 'No owner'}
              </div>
            </div>
            <AnimatePresence>
              {lockState.locked && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="badge badge-owner"
                >
                  T{lockState.owner} holds lock
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Queue */}
          <div className="flex-1 min-w-40">
            <div className="text-sm text-slate-400 mb-3">
              FIFO Queue — <span className="font-mono" style={{ color: '#ff3366' }}>{queue.length} blocked</span>
            </div>
            <div className="flex gap-2 flex-wrap min-h-10 items-center">
              <AnimatePresence>
                {queue.length === 0
                  ? <span className="text-xs text-slate-700 italic">empty</span>
                  : queue.map((id, idx) => (
                    <motion.div key={id} className="flex items-center gap-1"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      {idx > 0 && <span className="text-slate-700 text-xs">→</span>}
                      <span className="badge badge-blocked">T{id}</span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Thread grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        <AnimatePresence>
          {threads.map(th => (
            <ThreadCard
              key={th.id} thread={th}
              isOwner={lockState.locked && th.id === lockState.owner}
            />
          ))}
        </AnimatePresence>
      </div>

      <LogBox entries={log} />
    </div>
  )
}
