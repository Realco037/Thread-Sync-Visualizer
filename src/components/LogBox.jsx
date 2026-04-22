import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLOR = {
  green: '#00ff88',
  amber: '#ffb700',
  red:   '#ff3366',
  blue:  '#00b4ff',
}

export default function LogBox({ entries }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [entries])

  return (
    <div
      ref={ref}
      className="font-mono text-sm rounded-xl p-4 overflow-y-auto"
      style={{
        height: '11rem',
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.4)',
      }}
    >
      {entries.length === 0 && (
        <span className="text-slate-600 italic">Simulation not started…</span>
      )}
      <AnimatePresence initial={false}>
        {entries.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="mb-0.5 leading-relaxed"
          >
            <span className="text-slate-600 mr-2 select-none">{e.t}s</span>
            <span style={{ color: COLOR[e.cls] ?? '#94a3b8' }}>{e.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
