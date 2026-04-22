import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SemaphoreSection    from './components/SemaphoreSection'
import MutexSection        from './components/MutexSection'
import MonitorSection      from './components/MonitorSection'
import DiningPhilosophers  from './components/DiningPhilosophers'

const TABS = [
  { id: 'semaphore',  label: 'Semaphore',           icon: '◎' },
  { id: 'mutex',      label: 'Mutex',               icon: '⊘' },
  { id: 'monitor',    label: 'Monitor',             icon: '⊞' },
  { id: 'dining',     label: 'Dining Philosophers', icon: '⬡' },
]

const LEGEND = [
  { state: 'Running', color: '#00ff88' },
  { state: 'Waiting', color: '#ffb700' },
  { state: 'Blocked', color: '#ff3366' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('semaphore')

  return (
    <div className="relative flex flex-col w-full min-h-screen bg-[#03050d] bg-grid">
      {/* Ambient orbs */}
      <div className="orb w-96 h-96 top-[-120px] left-[-80px]"
           style={{ background: 'rgba(168,85,247,0.18)' }} />
      <div className="orb w-80 h-80 bottom-[-80px] right-[-60px]"
           style={{ background: 'rgba(0,180,255,0.12)', animationDelay: '3s' }} />
      <div className="orb w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
           style={{ background: 'rgba(0,255,136,0.06)', animationDelay: '6s' }} />

      {/* ── Header ──────────────────────────────────────── */}
      <header className="relative z-10 flex-none">
        <div className="glass border-b border-white/[0.05] px-8 py-4 flex items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3 select-none flex-none">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
                 style={{
                   background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(0,180,255,0.9))',
                   boxShadow: '0 0 16px rgba(168,85,247,0.45)'
                 }}>
              <span className="text-white font-bold text-base font-mono">T</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide leading-tight">
                Thread Sync Visualizer
              </h1>
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                OS Primitives · Interactive
              </p>
            </div>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-1 p-1 rounded-full glass-rim">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-pill ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="mr-1.5 opacity-70 text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Legend */}
          <div className="flex items-center gap-5 flex-none">
            {LEGEND.map(l => (
              <div key={l.state} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-none"
                      style={{ background: l.color, boxShadow: `0 0 7px ${l.color}` }} />
                <span className="text-sm text-slate-400">{l.state}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {activeTab === 'semaphore' && <SemaphoreSection />}
            {activeTab === 'mutex'     && <MutexSection />}
            {activeTab === 'monitor'   && <MonitorSection />}
            {activeTab === 'dining'    && <DiningPhilosophers />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
