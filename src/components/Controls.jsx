import { motion } from 'framer-motion'

function CtrlBtn({ onClick, disabled, variant = 'default', children }) {
  const styles = {
    primary: {
      background: 'rgba(168,85,247,0.18)',
      border:     '1px solid rgba(168,85,247,0.5)',
      color:      '#c084fc',
      shadow:     '0 0 10px rgba(168,85,247,0.25)',
    },
    default: {
      background: 'rgba(255,255,255,0.05)',
      border:     '1px solid rgba(255,255,255,0.1)',
      color:      '#94a3b8',
      shadow:     'none',
    },
    danger: {
      background: 'rgba(255,51,102,0.1)',
      border:     '1px solid rgba(255,51,102,0.3)',
      color:      '#fb7185',
      shadow:     'none',
    },
  }
  const s = styles[variant]
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      whileHover={disabled ? {} : { brightness: 1.2 }}
      style={{ ...s, boxShadow: s.shadow }}
      className="px-5 py-2 text-sm font-semibold rounded-lg transition-opacity
                 disabled:opacity-30 disabled:cursor-not-allowed tracking-wide"
    >
      {children}
    </motion.button>
  )
}

export default function Controls({ running, paused, onStart, onPause, onReset, speed, onSpeed, children, className }) {
  const handlePause = () => {
    if (paused) onPause?.()   // resume
    else        onPause?.()   // pause
  }

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className || 'mb-4'}`}>
      <CtrlBtn onClick={onStart} disabled={running && !paused} variant="primary">
        ▶ Start
      </CtrlBtn>
      <CtrlBtn onClick={onPause} disabled={!running}>
        {paused ? '▷ Resume' : '⏸ Pause'}
      </CtrlBtn>
      <CtrlBtn onClick={onReset} variant="danger">
        ↺ Reset
      </CtrlBtn>

      {children}

      {/* Speed control */}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Speed</span>
        <div className="relative flex items-center">
          <input
            type="range" min="0.5" max="3" step="0.5" value={speed}
            onChange={e => onSpeed(parseFloat(e.target.value))}
            className="w-28 h-1.5 appearance-none rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((speed - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((speed - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>
        <span className="text-sm font-mono w-8 text-right"
              style={{ color: '#a855f7' }}>
          {speed}×
        </span>
      </div>
    </div>
  )
}
