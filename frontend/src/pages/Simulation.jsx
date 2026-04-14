import { useState, useEffect, useRef, useCallback } from 'react'
import { getSimulation } from '../services/api'
import ControlBar from '../components/ControlBar'
import DatasetPanel from '../components/DatasetPanel'
import LSTMVisualizer from '../components/LSTMVisualizer'
import GraphPanel from '../components/GraphPanel'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import { motion, AnimatePresence } from 'framer-motion'

const SPEED_MS = { 0.5: 1600, 1: 800, 2: 400, 4: 200 }

export default function Simulation() {
  const [dataset,    setDataset]    = useState('sine')
  const [simData,    setSimData]    = useState([])
  const [meta,       setMeta]       = useState({})
  const [currentT,   setCurrentT]   = useState(0)
  const [playing,    setPlaying]    = useState(false)
  const [speed,      setSpeed]      = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const timerRef = useRef(null)

  // Fetch simulation data
  useEffect(() => {
    setLoading(true); setError(null); setPlaying(false); setCurrentT(0)
    getSimulation(dataset)
      .then(res => { setSimData(res.timesteps || []); setMeta(res.meta || {}) })
      .catch(() => setError('Backend unreachable. Make sure the API server is running.'))
      .finally(() => setLoading(false))
  }, [dataset])

  // Playback timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (playing && simData.length) {
      timerRef.current = setInterval(() => {
        setCurrentT(t => {
          if (t >= simData.length - 1) { setPlaying(false); return t }
          return t + 1
        })
      }, SPEED_MS[speed] || 800)
    }
    return () => clearInterval(timerRef.current)
  }, [playing, speed, simData.length])

  const handleStep = useCallback((delta) => {
    if (typeof delta === 'number' && Math.abs(delta) > 1) {
      // Absolute seek from scrubber
      setCurrentT(Math.max(0, Math.min(simData.length - 1, currentT + delta)))
    } else {
      setCurrentT(t => Math.max(0, Math.min(simData.length - 1, t + delta)))
    }
  }, [currentT, simData.length])

  const currentData = simData[currentT] || null

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Control Bar */}
      <ControlBar
        dataset={dataset} onDataset={d => setDataset(d)}
        playing={playing} onPlay={() => setPlaying(p => !p)}
        onStep={handleStep} speed={speed} onSpeed={setSpeed}
        onReset={() => { setCurrentT(0); setPlaying(false) }}
        currentT={currentT} totalT={simData.length || 1}
      />

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ background: 'rgba(248,113,113,0.08)', borderBottom: '1px solid rgba(248,113,113,0.2)',
              padding: '8px 24px', fontSize: 12, color: '#F87171', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(11,15,20,0.85)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
            <div style={{ color: '#00E5FF', fontSize: 13 }}>Loading {dataset} simulation…</div>
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 300px', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Dataset panel */}
        <div style={{ borderRight: '1px solid rgba(0,229,255,0.08)', overflowY: 'auto' }}>
          <DatasetPanel meta={meta} simData={simData} currentT={currentT} />
        </div>

        {/* Center: LSTM Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Visualizer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#080c13', flex: '0 0 auto', height: '55%', minHeight: 300, position: 'relative',
              borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
              <div style={{ position: 'absolute', inset: 0, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.1em', marginBottom: 4 }}>
                  LSTM CELL · T={currentT} {currentData?.char ? `· char='${currentData.char}'` : ''}
                </div>
                <LSTMVisualizer data={currentData} playing={playing}/>
              </div>
            </div>

            {/* Bottom: Graph panel */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <GraphPanel simData={simData} currentT={currentT}/>
            </div>
          </div>
        </div>

        {/* Right: Explainability */}
        <div style={{ borderLeft: '1px solid rgba(0,229,255,0.08)', overflowY: 'auto' }}>
          <ExplainabilityPanel data={currentData} dataset={dataset} currentT={currentT}/>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
