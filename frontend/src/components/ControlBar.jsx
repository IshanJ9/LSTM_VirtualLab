import { motion } from 'framer-motion'

const DATASETS = [
  { id: 'sine',       label: 'Sine Wave',     color: '#00E5FF', icon: '〜' },
  { id: 'noisy',      label: 'Noisy Signal',  color: '#8B5CF6', icon: '⌇' },
  { id: 'text',       label: 'Char Sequence', color: '#F59E0B', icon: 'Aa' },
  { id: 'long-range', label: 'Long-Range',    color: '#10B981', icon: '⟵' },
]

const SPEEDS = [0.5, 1, 2, 4]

export default function ControlBar({ dataset, onDataset, playing, onPlay, onStep, speed, onSpeed, onReset, currentT, totalT }) {
  return (
    <div style={{
      height: 72, background: '#0a0e17',
      borderBottom: '1px solid rgba(0,229,255,0.1)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px',
      flexShrink: 0,
    }}>
      {/* Dataset selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {DATASETS.map(d => (
          <motion.button
            key={d.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDataset(d.id)}
            style={{
              padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
              border: `1px solid ${dataset === d.id ? d.color : 'rgba(255,255,255,0.08)'}`,
              background: dataset === d.id ? `${d.color}18` : 'transparent',
              color: dataset === d.id ? d.color : '#64748B',
              fontWeight: dataset === d.id ? 600 : 400,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{d.icon}</span>
            {d.label}
          </motion.button>
        ))}
      </div>

      <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />

      {/* Playback controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn onClick={() => onStep(-1)} title="Step back">⟨</Btn>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onPlay}
          style={{
            width: 38, height: 38, borderRadius: 9,
            background: playing ? 'rgba(0,229,255,0.15)' : 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.35)',
            color: '#00E5FF', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: playing ? '0 0 14px rgba(0,229,255,0.3)' : 'none',
          }}
        >{playing ? '⏸' : '▶'}</motion.button>
        <Btn onClick={() => onStep(1)} title="Step forward">⟩</Btn>
        <Btn onClick={onReset} title="Reset">↺</Btn>
      </div>

      {/* Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B' }}>SPEED</span>
        {SPEEDS.map(s => (
          <button key={s} onClick={() => onSpeed(s)} style={{
            padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11,
            border: `1px solid ${speed === s ? '#00E5FF55' : 'rgba(255,255,255,0.06)'}`,
            background: speed === s ? 'rgba(0,229,255,0.1)' : 'transparent',
            color: speed === s ? '#00E5FF' : '#64748B',
            transition: 'all 0.15s',
          }}>{s}×</button>
        ))}
      </div>

      {/* Scrubber */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
        <span style={{ fontSize: 11, color: '#64748B', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
          T: <span style={{ color: '#00E5FF' }}>{String(currentT).padStart(3,'0')}</span>/{totalT - 1}
        </span>
        <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: '0 0 0 0', height: 3, top: '50%', transform: 'translateY(-50%)',
            borderRadius: 2, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', height: 3, top: '50%', transform: 'translateY(-50%)',
            borderRadius: 2, background: 'linear-gradient(90deg,#00E5FF,#8B5CF6)',
            width: `${totalT > 1 ? (currentT / (totalT - 1)) * 100 : 0}%` }} />
          <input
            type="range" min={0} max={totalT - 1} value={currentT}
            onChange={e => onStep(parseInt(e.target.value) - currentT)}
            style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

function Btn({ onClick, children, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 7,
      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
      color: '#94A3B8', fontSize: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.color = '#00E5FF' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94A3B8' }}
    >{children}</button>
  )
}
