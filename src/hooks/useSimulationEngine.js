import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * useSimulationEngine
 *
 * Centralises the control-flow (start / pause / resume / reset) and the
 * setTimeout tick loop shared by every simulation section.
 *
 * @param {object} options
 * @param {(speed: number) => void} options.onTick   - Called on every tick; receives current speed multiplier.
 * @param {() => void}              options.onReset  - Called when the user clicks Reset; should reset sim state.
 * @param {number}                  [options.initialSpeed=1]
 * @param {number}                  [options.baseInterval=150] - Base ms between ticks at 1× speed.
 *
 * @returns {{
 *   running: boolean,
 *   paused:  boolean,
 *   speed:   number,
 *   speedRef: React.MutableRefObject<number>,
 *   start:   () => void,
 *   pause:   () => void,
 *   resume:  () => void,
 *   reset:   () => void,
 *   setSpeed: (s: number) => void,
 * }}
 */
export function useSimulationEngine({
  onTick,
  onReset,
  initialSpeed   = 1,
  baseInterval   = 150,
} = {}) {
  const [running, setRunning] = useState(false)
  const [paused,  setPaused]  = useState(false)
  const [speed,   setSpeedState] = useState(initialSpeed)

  // Refs so the async setTimeout closure always reads the latest values
  const runningRef  = useRef(false)
  const pausedRef   = useRef(false)
  const speedRef    = useRef(initialSpeed)
  const timerRef    = useRef(null)

  // Keep a ref to onTick/onReset so callers can swap them each render
  // without recreating the loop functions.
  const onTickRef   = useRef(onTick)
  const onResetRef  = useRef(onReset)
  useEffect(() => { onTickRef.current  = onTick  }, [onTick])
  useEffect(() => { onResetRef.current = onReset }, [onReset])

  // Core loop — defined once; reads live values through refs
  const loop = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return
    onTickRef.current?.(speedRef.current)
    timerRef.current = setTimeout(loop, baseInterval / speedRef.current)
  }, [baseInterval])

  const start = useCallback(() => {
    if (runningRef.current) return          // already running
    runningRef.current = true
    pausedRef.current  = false
    setRunning(true)
    setPaused(false)
    loop()
  }, [loop])

  const pause = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return
    pausedRef.current = true
    setPaused(true)
    clearTimeout(timerRef.current)
  }, [])

  const resume = useCallback(() => {
    if (!runningRef.current || !pausedRef.current) return
    pausedRef.current = false
    setPaused(false)
    loop()
  }, [loop])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    runningRef.current = false
    pausedRef.current  = false
    setRunning(false)
    setPaused(false)
    onResetRef.current?.()
  }, [])

  const setSpeed = useCallback((s) => {
    speedRef.current = s
    setSpeedState(s)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { running, paused, speed, speedRef, start, pause, resume, reset, setSpeed }
}
