import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, AreaChart, Area
} from 'recharts'

const TABS = ['Prediction', 'Gates', 'Heatmap']

const PredTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: '#64748B' }}>T = {d?.t}</div>
      <div style={{ color: '#00E5FF' }}>Predicted: {d?.predicted?.toFixed(4)}</div>
      <div style={{ color: '#E2E8F0' }}>Actual: {d?.actual?.toFixed(4)}</div>
      <div style={{ color: d?.predicted - d?.actual > 0.05 ? '#F87171' : '#10B981' }}>
        Error: {Math.abs(d?.predicted - d?.actual)?.toFixed(4)}
      </div>
      {d?.char && <div style={{ color: '#F59E0B' }}>Char: '{d.char}'</div>}
    </div>
  )
}

const GateTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ color: '#64748B' }}>T = {d?.t}</div>
      <div style={{ color: '#00E5FF'  }}>Forget: {d?.forget_gate?.toFixed(3)}</div>
      <div style={{ color: '#8B5CF6' }}>Input:  {d?.input_gate?.toFixed(3)}</div>
      <div style={{ color: '#10B981' }}>Cand:   {d?.candidate?.toFixed(3)}</div>
      <div style={{ color: '#F59E0B' }}>Output: {d?.output_gate?.toFixed(3)}</div>
    </div>
  )
}

function HiddenHeatmap({ simData, currentT }) {
  if (!simData?.length) return null
  const rows = 8
  const display = simData.slice(0, Math.min(simData.length, 50))
  const cellW = Math.max(8, Math.floor(700 / display.length))
  const cellH = 20

  return (
    <div style={{ overflowX: 'auto', padding: '8px 0' }}>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6, paddingLeft: 4 }}>HIDDEN STATE HEATMAP (h_t · 8 units × time)</div>
      <svg width={Math.max(700, display.length * cellW)} height={rows * cellH + 24}>
        {display.map((step, ti) => (
          step.hidden_state?.slice(0, rows).map((v, ri) => {
            const intensity = Math.min(Math.abs(v), 1)
            const isPos = v >= 0
            const r = isPos ? 0 : Math.round(intensity * 139)
            const g = isPos ? Math.round(intensity * 229) : Math.round(intensity * 92)
            const b = isPos ? Math.round(intensity * 255) : Math.round(intensity * 246)
            return (
              <rect key={`${ti}-${ri}`}
                x={ti * cellW} y={ri * cellH}
                width={cellW - 1} height={cellH - 1} rx={1}
                fill={`rgb(${r},${g},${b})`} opacity={0.15 + intensity * 0.75}
              />
            )
          })
        ))}
        {/* Current timestep marker */}
        <rect x={currentT * cellW} y={0} width={Math.max(2, cellW)} height={rows * cellH}
          fill="none" stroke="rgba(0,229,255,0.7)" strokeWidth={1.5} />
        {/* Row labels */}
        {Array.from({ length: rows }, (_, i) => (
          <text key={i} x={display.length * cellW + 4} y={i * cellH + 14}
            fontSize={8} fill="#475569">h{i}</text>
        ))}
        {/* Time labels */}
        {[0, Math.floor(display.length/4), Math.floor(display.length/2), display.length-1].map(ti => (
          <text key={ti} x={ti * cellW} y={rows * cellH + 14}
            fontSize={8} fill="#475569">{simData[ti]?.t}</text>
        ))}
      </svg>
    </div>
  )
}

export default function GraphPanel({ simData, currentT }) {
  const [tab, setTab] = useState('Prediction')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0a111d',
      borderTop: '1px solid rgba(0,229,255,0.08)', padding: '10px 16px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '4px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
            border: `1px solid ${tab===t ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            background: tab===t ? 'rgba(0,229,255,0.08)' : 'transparent',
            color: tab===t ? '#00E5FF' : '#64748B', fontWeight: tab===t ? 600 : 400,
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === 'Prediction' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <YAxis domain={[0,1]} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<PredTooltip />}/>
              <Legend wrapperStyle={{ fontSize: 10, color: '#64748B' }}/>
              <ReferenceLine x={currentT} stroke="rgba(0,229,255,0.4)" strokeWidth={1.5} strokeDasharray="4 3"/>
              <Area type="monotone" dataKey="actual"    stroke="#00E5FF" strokeWidth={1.5} fill="url(#actGrad)"  dot={false} name="Actual"/>
              <Area type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#predGrad)" dot={false} name="Predicted"/>
            </AreaChart>
          </ResponsiveContainer>
        )}

        {tab === 'Gates' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <YAxis domain={[0,1]} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<GateTooltip />}/>
              <Legend wrapperStyle={{ fontSize: 10 }}/>
              <ReferenceLine x={currentT} stroke="rgba(0,229,255,0.4)" strokeWidth={1.5} strokeDasharray="4 3"/>
              <Line type="monotone" dataKey="forget_gate"  stroke="#00E5FF" strokeWidth={1.5} dot={false} name="Forget"/>
              <Line type="monotone" dataKey="input_gate"   stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="Input"/>
              <Line type="monotone" dataKey="candidate"    stroke="#10B981" strokeWidth={1.5} dot={false} name="Candidate"/>
              <Line type="monotone" dataKey="output_gate"  stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Output"/>
            </LineChart>
          </ResponsiveContainer>
        )}

        {tab === 'Heatmap' && <HiddenHeatmap simData={simData} currentT={currentT}/>}
      </div>
    </div>
  )
}
