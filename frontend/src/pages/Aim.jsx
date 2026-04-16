import { motion } from 'framer-motion'

const card = (delay) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

export default function Aim() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '40px 60px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <motion.div {...card(0)} style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, color: '#00E5FF', letterSpacing: '0.2em', marginBottom: 12 }}>RESEARCH PLATFORM</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px',
          background: 'linear-gradient(135deg, #E2E8F0, #00E5FF, #8B5CF6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          LSTM Lab
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 600, lineHeight: 1.7, margin: 0 }}>
          An Interactive Visual Analytics Platform for Interpretable Sequential Modeling.
          A scientific instrument for inspecting neural memory.
        </p>
      </motion.div>

      {/* Aim cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 40 }}>
        {[
          { icon: '🔬', title: 'Primary Aim', color: '#00E5FF',
            text: 'Provide a research-grade interactive environment to explore, visualize, and interpret the internal mechanics of Long Short-Term Memory networks at every timestep.' },
          { icon: '🧠', title: 'Scientific Transparency', color: '#8B5CF6',
            text: 'Expose all gate activations (forget, input, output, candidate), cell states, and hidden states — making every computation inspectable and explainable.' },
          { icon: '📊', title: 'Benchmark Analysis', color: '#10B981',
            text: 'Enable controlled experimentation across four carefully designed benchmark datasets that probe different facets of LSTM memory and learning behavior.' },
          { icon: '⚡', title: 'Explainability Integration', color: '#F59E0B',
            text: 'Deliver gate-level contributions, memory persistence analysis, failure case detection, and counterfactual "what-if" simulation — all interactively.' },
        ].map((c, i) => (
          <motion.div key={i} {...card(0.1 + i * 0.1)} style={{
            background: '#0f1623', border: `1px solid ${c.color}22`,
            borderRadius: 14, padding: 24,
            boxShadow: `0 0 30px ${c.color}06`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: c.color, marginBottom: 8, margin: '0 0 8px' }}>{c.title}</h2>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{c.text}</p>
          </motion.div>
        ))}
      </div>

      {/* What makes this different */}
      <motion.div {...card(0.5)} style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(139,92,246,0.05))',
        border: '1px solid rgba(0,229,255,0.12)', borderRadius: 14, padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E2E8F0', marginBottom: 16, margin: '0 0 16px' }}>
          Why This Platform?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { label: 'Beyond Black-Box', text: 'Custom PyTorch LSTM with explicit gate computation — not a wrapped nn.LSTM.' },
            { label: 'Real Datasets', text: '4 benchmark datasets covering periodicity, noise, symbolic memory, and long-range dependencies.' },
            { label: 'Live Analytics', text: 'Counterfactual simulation, gate contribution scoring, and memory persistence tracking in one interface.' },
          ].map((it, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#00E5FF', marginBottom: 6 }}>{it.label}</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{it.text}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
