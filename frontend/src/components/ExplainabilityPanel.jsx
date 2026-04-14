import { useState } from 'react'
import { postCounterfactual } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'

const GATES = [
  { key: 'forget_gate', label: 'Forget Gate', color: '#00E5FF' },
  { key: 'input_gate',  label: 'Input Gate',  color: '#8B5CF6' },
  { key: 'output_gate', label: 'Output Gate', color: '#F59E0B' },
]

function GateBar({ label, value, color, note }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color }}>{value?.toFixed(4)}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${(value||0)*100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3 }}
        />
      </div>
      {note && <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{note}</div>}
    </div>
  )
}

export default function ExplainabilityPanel({ data, dataset, currentT }) {
  const [gate, setGate]           = useState('forget_gate')
  const [newVal, setNewVal]       = useState(0.5)
  const [cfResult, setCfResult]   = useState(null)
  const [loading, setLoading]     = useState(false)

  const d = data || {}
  const fg = d.forget_gate ?? 0.5
  const ig = d.input_gate  ?? 0.5
  const og = d.output_gate ?? 0.5
  const cd = d.candidate   ?? 0.5

  const interpretGate = (key, val) => {
    const pct = (val * 100).toFixed(0)
    if (key === 'forget_gate') return val > 0.7 ? `Strong memory retention (${pct}%)` : val < 0.3 ? `Memory erased (${pct}%)` : `Partial retention (${pct}%)`
    if (key === 'input_gate')  return val > 0.7 ? `High input absorption (${pct}%)` : val < 0.3 ? `Input blocked (${pct}%)` : `Selective input (${pct}%)`
    if (key === 'output_gate') return val > 0.7 ? `Full output reveal (${pct}%)` : val < 0.3 ? `Output suppressed (${pct}%)` : `Partial output (${pct}%)`
    return `Candidate value: ${val.toFixed(3)}`
  }

  const runCF = async () => {
    setLoading(true); setCfResult(null)
    try {
      const res = await postCounterfactual({ dataset, timestep: currentT, gate, new_value: newVal })
      setCfResult(res)
    } catch { setCfResult({ error: 'Backend unavailable' }) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 14, overflowY: 'auto' }}>
      {/* Gate activations */}
      <div style={{ background: '#0a111d', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
        <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>GATE ACTIVATIONS</div>
        <GateBar label="Forget Gate" value={fg} color="#00E5FF" note={interpretGate('forget_gate', fg)}/>
        <GateBar label="Input Gate"  value={ig} color="#8B5CF6" note={interpretGate('input_gate', ig)}/>
        <GateBar label="Candidate"   value={cd} color="#10B981" note={interpretGate('candidate', cd)}/>
        <GateBar label="Output Gate" value={og} color="#F59E0B" note={interpretGate('output_gate', og)}/>
      </div>

      {/* Error indicator */}
      {d.predicted !== undefined && (
        <div style={{
          background: Math.abs(d.predicted - d.actual) > 0.1 ? 'rgba(248,113,113,0.06)' : 'rgba(16,185,129,0.06)',
          border: `1px solid ${Math.abs(d.predicted - d.actual) > 0.1 ? 'rgba(248,113,113,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 8, padding: '8px 12px', fontSize: 11,
        }}>
          <div style={{ color: '#64748B', marginBottom: 4, fontSize: 10 }}>PREDICTION ERROR</div>
          <div style={{ color: Math.abs(d.predicted - d.actual) > 0.1 ? '#F87171' : '#10B981',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600 }}>
            {Math.abs((d.predicted - d.actual)||0).toFixed(5)}
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>
            {Math.abs(d.predicted - d.actual) > 0.1 ? '⚠ High error — gate failure likely' : '✓ Within tolerance'}
          </div>
        </div>
      )}

      {/* Counterfactual */}
      <div style={{ background: '#0a111d', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)', padding: 14 }}>
        <div style={{ fontSize: 10, color: '#8B5CF6', letterSpacing: '0.1em', marginBottom: 10 }}>COUNTERFACTUAL ANALYSIS</div>

        {/* Gate selector */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {GATES.map(g => (
            <button key={g.key} onClick={() => setGate(g.key)} style={{
              flex: 1, padding: '4px 0', borderRadius: 5, cursor: 'pointer', fontSize: 10,
              border: `1px solid ${gate===g.key ? g.color+'66' : 'rgba(255,255,255,0.06)'}`,
              background: gate===g.key ? g.color+'18' : 'transparent',
              color: gate===g.key ? g.color : '#64748B', transition: 'all 0.15s',
            }}>{g.label.split(' ')[0]}</button>
          ))}
        </div>

        {/* Value slider */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10 }}>
            <span style={{ color: '#64748B' }}>New value</span>
            <span style={{ color: '#8B5CF6', fontFamily: 'monospace' }}>{newVal.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={newVal}
            onChange={e => { setNewVal(parseFloat(e.target.value)); setCfResult(null) }}
            style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334155' }}>
            <span>0.00</span><span>0.50</span><span>1.00</span>
          </div>
        </div>

        <button onClick={runCF} disabled={loading} style={{
          width: '100%', padding: '8px 0', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
          color: '#8B5CF6', fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}>{loading ? 'Computing…' : '⚡ Run Counterfactual'}</button>

        <AnimatePresence>
          {cfResult && !cfResult.error && (
            <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                <StatMini label="Original" value={cfResult.original_prediction?.toFixed(4)} color="#94A3B8"/>
                <StatMini label="New Pred"  value={cfResult.new_prediction?.toFixed(4)}      color="#8B5CF6"/>
                <StatMini label="Δ Output"  value={(cfResult.delta_output>=0?'+':'')+cfResult.delta_output?.toFixed(4)} color={cfResult.delta_output>0?'#10B981':'#F87171'}/>
                <StatMini label="T"         value={cfResult.timestep}                          color="#64748B"/>
              </div>
              <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, padding: '6px 8px',
                background: 'rgba(139,92,246,0.05)', borderRadius: 6, border: '1px solid rgba(139,92,246,0.1)' }}>
                {cfResult.interpretation}
              </div>
            </motion.div>
          )}
          {cfResult?.error && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#F87171' }}>{cfResult.error}</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StatMini({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: '5px 8px' }}>
      <div style={{ fontSize: 9, color: '#475569' }}>{label}</div>
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color }}>{value}</div>
    </div>
  )
}
