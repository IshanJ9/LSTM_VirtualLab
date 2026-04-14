import { motion } from 'framer-motion'

const OBJECTIVES = [
  { num: '01', title: 'Understand LSTM Cell Mechanics',    color: '#00E5FF',
    points: ['Trace forget, input, output and candidate gate computations', 'Observe how cell state evolves across time', 'Visualize the relationship between h_t-1, x_t and new h_t'] },
  { num: '02', title: 'Analyze Gate Behavior on Benchmarks', color: '#8B5CF6',
    points: ['Compare gate dynamics across sine, noisy, text and long-range datasets', 'Identify which gates dominate for different dependency types', 'Observe how the forget gate protects or erases long-term memory'] },
  { num: '03', title: 'Apply Explainability Techniques',  color: '#10B981',
    points: ['Compute normalized gate contribution scores', 'Track memory persistence via cell state autocorrelation', 'Run counterfactual "what-if" analyses on gate activations'] },
  { num: '04', title: 'Interact with Timestep Dynamics',  color: '#F59E0B',
    points: ['Scrub through time to inspect any single timestep', 'Use play/pause and speed controls for animated walkthrough', 'Hover and click gates for instant insight popups'] },
  { num: '05', title: 'Identify Failure Patterns',        color: '#F87171',
    points: ['Detect timesteps where prediction error exceeds threshold', 'Correlate failures with specific gate activation patterns', 'Understand when and why the model struggles'] },
  { num: '06', title: 'Evaluate with Quiz & Certification', color: '#A78BFA',
    points: ['Answer 10 scenario-based LSTM questions', 'Receive instant score and interpretation feedback', 'Download a personalized PDF certificate of achievement'] },
]

export default function Objectives() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '40px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: 8 }}>LEARNING OBJECTIVES</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#E2E8F0', margin: '0 0 12px' }}>What You Will Learn</h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          Six structured objectives guide your exploration from mechanics to mastery.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {OBJECTIVES.map((obj, i) => (
          <motion.div key={i}
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}
            style={{
              background: '#0f1623', border: `1px solid ${obj.color}22`, borderRadius: 14,
              padding: 22, position: 'relative', overflow: 'hidden',
            }}>
            {/* Number watermark */}
            <div style={{ position: 'absolute', right: 16, top: 10, fontSize: 48, fontWeight: 800,
              color: obj.color, opacity: 0.06, fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}>
              {obj.num}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: obj.color, fontWeight: 700 }}>{obj.num}</span>
              <div style={{ width: 28, height: 1, background: obj.color, opacity: 0.4 }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{obj.title}</span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {obj.points.map((pt, j) => (
                <li key={j} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  <span style={{ color: obj.color, flexShrink: 0, marginTop: 1 }}>›</span>
                  {pt}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
