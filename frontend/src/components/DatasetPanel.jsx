import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const DATASET_COLORS = {
  sine: '#00E5FF', noisy: '#8B5CF6', text: '#F59E0B', 'long-range': '#10B981',
}

const CustomTooltip = ({ active, payload, dataKey }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: '#0f1623', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#64748B' }}>T = {d?.t}</div>
      <div style={{ color: '#00E5FF', fontFamily: 'monospace' }}>{d?.input?.toFixed(4)}</div>
      {d?.char && <div style={{ color: '#F59E0B' }}>char: <b>'{d.char}'</b></div>}
    </div>
  )
}

export default function DatasetPanel({ meta, simData, currentT }) {
  const color = DATASET_COLORS[meta?.id] || '#00E5FF'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      {/* Metadata card */}
      <div style={{
        background: '#121c2e', borderRadius: 10,
        border: `1px solid ${color}22`,
        padding: 14, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{meta?.name || 'Dataset'}</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
          <Row label="Type"  value={meta?.type} />
          <Row label="Focus" value={meta?.focus} />
          <Row label="Length" value={`${meta?.sequence_length || '—'} steps`} />
          {meta?.delay && <Row label="Delay" value={`${meta.delay} steps`} />}
        </div>
        <p style={{ fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 1.55 }}>{meta?.description}</p>
      </div>

      {/* Input sequence chart */}
      <div style={{ background: '#0a111d', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: '10px 10px 4px', flex: 1 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, paddingLeft: 4, letterSpacing: '0.05em' }}>
          INPUT SEQUENCE
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={simData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={currentT} stroke="rgba(0,229,255,0.5)" strokeWidth={1.5} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="input" stroke={color} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="actual" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current step info */}
      {simData[currentT] && (
        <div style={{ background: '#0a111d', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>CURRENT TIMESTEP · T={currentT}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Stat label="Input"     value={simData[currentT].input?.toFixed(4)} color={color} />
            <Stat label="Actual"    value={simData[currentT].actual?.toFixed(4)} color="#E2E8F0" />
            <Stat label="Predicted" value={simData[currentT].predicted?.toFixed(4)} color="#8B5CF6" />
            {simData[currentT].char && <Stat label="Char" value={`'${simData[currentT].char}'`} color="#F59E0B" />}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
      <span style={{ color: '#475569', minWidth: 40 }}>{label}:</span>
      <span style={{ color: '#94A3B8' }}>{value}</span>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '5px 8px' }}>
      <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color }}>{value}</div>
    </div>
  )
}
