import { motion, AnimatePresence } from 'framer-motion'

const STATE_CFG = {
  running: {
    color:    '#00ff88',
    bg:       'rgba(0,255,136,0.07)',
    border:   'rgba(0,255,136,0.35)',
    barColor: '#00ff88',
    glow:     '0 0 10px rgba(0,255,136,0.45), 0 0 24px rgba(0,255,136,0.15)',
    label:    '#00ff88',
    dot:      '#00ff88',
  },
  waiting: {
    color:    '#ffb700',
    bg:       'rgba(255,183,0,0.07)',
    border:   'rgba(255,183,0,0.35)',
    barColor: '#ffb700',
    glow:     '0 0 10px rgba(255,183,0,0.4), 0 0 24px rgba(255,183,0,0.12)',
    label:    '#ffb700',
    dot:      '#ffb700',
  },
  blocked: {
    color:    '#ff3366',
    bg:       'rgba(255,51,102,0.07)',
    border:   'rgba(255,51,102,0.35)',
    barColor: '#ff3366',
    glow:     '0 0 10px rgba(255,51,102,0.4), 0 0 24px rgba(255,51,102,0.12)',
    label:    '#ff3366',
    dot:      '#ff3366',
  },
}

export default function ThreadCard({ thread, isOwner, badge }) {
  const cfg = STATE_CFG[thread.state] ?? STATE_CFG.waiting
  const progress = Math.min(100, Math.max(0, thread.progress ?? 0))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
      }}
      className="rounded-xl p-5 relative overflow-hidden"
    >
      {/* Subtle inner shimmer strip */}
      <div className="absolute inset-x-0 top-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}55, transparent)` }} />

      {/* Owner ring highlight */}
      {isOwner && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: '1.5px solid rgba(0,180,255,0.6)',
                   boxShadow: '0 0 14px rgba(0,180,255,0.3), inset 0 0 8px rgba(0,180,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* State dot */}
        <motion.span
          className="w-2.5 h-2.5 rounded-full flex-none"
          style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
          animate={{ opacity: thread.state === 'running' ? [0.6, 1, 0.6] : 1 }}
          transition={{ duration: 1.4, repeat: thread.state === 'running' ? Infinity : 0, ease: 'easeInOut' }}
        />

        <span className="text-sm font-semibold text-slate-200 font-mono flex-1">
          {thread.label ?? `T${thread.id}`}
        </span>

        {/* Badges */}
        <AnimatePresence>
          {isOwner && (
            <motion.span
              key="owner"
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="badge badge-owner"
            >
              owner
            </motion.span>
          )}
          {badge && (
            <motion.span
              key={badge}
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className={`badge ${badge === 'producer' ? 'badge-running' : 'badge-owner'}`}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* State label with animated transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={thread.state}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="text-xs font-semibold uppercase tracking-widest font-mono mb-3"
          style={{ color: cfg.label }}
        >
          {thread.state}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden"
           style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.barColor,
                   boxShadow: `0 0 6px ${cfg.barColor}80` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}
