import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts'
import { motion } from 'framer-motion'

function Section({ title, children, accent = '#00E5FF' }) {
  return (
    <div style={{ background: '#0a111d', borderRadius: 10, border: `1px solid ${accent}18`, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: accent, letterSpacing: '0.1em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

export default function AnalysisPanel({ analysisData }) {
  if (!analysisData) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
      Select a dataset and click Analysis to load data.
    </div>
  )

  const { gate_contribution, memory_persistence, failure_cases, mean_absolute_error, total_timesteps, failure_rate } = analysisData

  // Radar data
  const radarData = gate_contribution ? [
    { gate: 'Forget', value: parseFloat((gate_contribution.forget_gate?.normalized_weight * 100).toFixed(1)) },
    { gate: 'Input',  value: parseFloat((gate_contribution.input_gate?.normalized_weight  * 100).toFixed(1)) },
    { gate: 'Output', value: parseFloat((gate_contribution.output_gate?.normalized_weight * 100).toFixed(1)) },
  ] : []

  // Memory persistence data
  const persData = memory_persistence?.autocorrelation?.map((v, i) => ({ lag: i, corr: v })) || []

  // Gate per-timestep bar snippet
  const gateColors = { forget_gate: '#00E5FF', input_gate: '#8B5CF6', output_gate: '#F59E0B' }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Mean Abs Error', value: mean_absolute_error?.toFixed(5), color: mean_absolute_error > 0.1 ? '#F87171' : '#10B981' },
          { label: 'Failure Rate',   value: `${(failure_rate*100)?.toFixed(1)}%`, color: failure_rate > 0.2 ? '#F87171' : '#10B981' },
          { label: 'Timesteps',      value: total_timesteps, color: '#94A3B8' },
        ].map(m => (
          <div key={m.label} style={{ background: '#0f1623', borderRadius: 8, padding: 12, textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Gate contribution radar */}
      <Section title="GATE CONTRIBUTION (NORMALIZED)" accent="#00E5FF">
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="gate" tick={{ fontSize: 11, fill: '#64748B' }}/>
              <Radar name="Weight" dataKey="value" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.15} strokeWidth={1.5}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 8 }}>
          {radarData.map((r, i) => (
            <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 0' }}>
              <div style={{ fontSize: 10, color: '#64748B' }}>{r.gate}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00E5FF', fontFamily: 'monospace' }}>{r.value}%</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gate stats table */}
      <Section title="GATE STATISTICS" accent="#8B5CF6">
        {gate_contribution && Object.entries(gate_contribution).map(([key, stats]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: gateColors[key] || '#94A3B8' }}>
                {key.replace('_gate','').toUpperCase()}
              </span>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>
                mean={stats.mean?.toFixed(3)} σ={stats.std?.toFixed(3)}
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${stats.mean*100}%`, background: gateColors[key], borderRadius: 3, opacity: 0.7 }}/>
            </div>
          </div>
        ))}
      </Section>

      {/* Memory persistence */}
      <Section title="MEMORY PERSISTENCE (AUTOCORRELATION)" accent="#10B981">
        <div style={{ marginBottom: 8, fontSize: 11 }}>
          <span style={{ color: '#64748B' }}>Score: </span>
          <span style={{ color: '#10B981', fontFamily: 'monospace', fontWeight: 700 }}>
            {memory_persistence?.persistence_score?.toFixed(4)}
          </span>
          <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{memory_persistence?.interpretation}</div>
        </div>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={persData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
              <XAxis dataKey="lag" tick={{ fontSize: 8, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <YAxis domain={[-1,1]} tick={{ fontSize: 8, fill: '#475569' }} tickLine={false} axisLine={false}/>
              <Tooltip formatter={(v) => v.toFixed(3)} contentStyle={{ background: '#0f1623', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, fontSize: 10 }}/>
              <Line type="monotone" dataKey="corr" stroke="#10B981" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Failure cases */}
      <Section title={`FAILURE CASES (${failure_cases?.length || 0} detected)`} accent="#F87171">
        {!failure_cases?.length ? (
          <div style={{ fontSize: 11, color: '#10B981' }}>✓ No significant failure cases detected.</div>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {failure_cases.slice(0, 15).map((fc, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.03 }}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: 6, alignItems: 'center',
                  padding: '5px 8px', marginBottom: 4, borderRadius: 6,
                  background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.1)',
                  fontSize: 10,
                }}
              >
                <span style={{ color: '#64748B', fontFamily: 'monospace' }}>T={fc.t}</span>
                <span style={{ color: '#94A3B8' }}>A: {fc.actual?.toFixed(3)}</span>
                <span style={{ color: '#8B5CF6' }}>P: {fc.predicted?.toFixed(3)}</span>
                <span style={{ color: '#F87171', fontFamily: 'monospace' }}>Δ{fc.error?.toFixed(3)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
