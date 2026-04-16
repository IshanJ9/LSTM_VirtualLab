import { motion } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/* ── KaTeX render helpers ───────────────────────────────────────── */
function InlineMath({ tex }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function BlockMath({ tex }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true })
  return (
    <div style={{
      background: 'rgba(0,229,255,0.04)',
      border: '1px solid rgba(0,229,255,0.14)',
      borderRadius: 8,
      padding: '12px 20px',
      margin: '12px 0',
      overflowX: 'auto',
      color: '#E2E8F0',
    }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/* ── Layout helpers ─────────────────────────────────────────────── */
const Sec = ({ title, color = '#00E5FF', children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    style={{
      background: '#0f1623',
      border: `1px solid ${color}18`,
      borderRadius: 14,
      padding: 26,
      marginBottom: 16,
    }}
  >
    <h2 style={{ fontSize: 15, fontWeight: 700, color, margin: '0 0 14px', letterSpacing: '0.02em' }}>{title}</h2>
    {children}
  </motion.div>
)

const P = ({ children }) => (
  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.8, margin: '0 0 10px' }}>{children}</p>
)

/* ── Page ───────────────────────────────────────────────────────── */
export default function Theory() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '36px 60px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: '#8B5CF6', letterSpacing: '0.2em', marginBottom: 8 }}>THEORETICAL BACKGROUND</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#E2E8F0', margin: 0 }}>LSTM Theory &amp; Mathematics</h1>
      </motion.div>

      {/* 1. Vanishing Gradient */}
      <Sec title="1. The Vanishing Gradient Problem" color="#F87171" delay={0.05}>
        <P>
          Standard RNNs suffer from vanishing gradients during backpropagation through time (BPTT).
          When sequences are long, gradients shrink exponentially as they flow backward, making it
          impossible to learn long-range dependencies.
        </P>
        <BlockMath tex={String.raw`\frac{\partial \mathcal{L}}{\partial W} \approx \prod_{i} \frac{\partial h_i}{\partial h_{i-1}} \;\rightarrow\; 0 \quad \text{when } \left|\frac{\partial h}{\partial h}\right| < 1`} />
        <P>
          LSTM solves this by introducing a cell state <InlineMath tex="C_t" /> — a dedicated memory highway
          with <em>additive</em> (not multiplicative) updates, preserving gradients across many timesteps.
        </P>
      </Sec>

      {/* 2. Gates */}
      <Sec title="2. LSTM Gating Equations" color="#00E5FF" delay={0.1}>
        <P>
          At each timestep <InlineMath tex="t" />, the LSTM receives input <InlineMath tex="x_t" /> and
          the previous hidden state <InlineMath tex="h_{t-1}" />. Four learned transformations control
          all information flow:
        </P>

        <BlockMath tex={String.raw`f_t = \sigma\!\left(W_f \cdot [h_{t-1},\, x_t] + b_f\right)`} />
        <div style={{ fontSize: 11, color: '#475569', marginTop: -6, marginBottom: 10, paddingLeft: 4 }}>
          Forget gate — decides what fraction of past cell state to erase
        </div>

        <BlockMath tex={String.raw`i_t = \sigma\!\left(W_i \cdot [h_{t-1},\, x_t] + b_i\right)`} />
        <div style={{ fontSize: 11, color: '#475569', marginTop: -6, marginBottom: 10, paddingLeft: 4 }}>
          Input gate — decides how much new information to write
        </div>

        <BlockMath tex={String.raw`\tilde{C}_t = \tanh\!\left(W_g \cdot [h_{t-1},\, x_t] + b_g\right)`} />
        <div style={{ fontSize: 11, color: '#475569', marginTop: -6, marginBottom: 10, paddingLeft: 4 }}>
          Candidate cell state — proposed update values (zero-centred, range −1 to 1)
        </div>

        <BlockMath tex={String.raw`o_t = \sigma\!\left(W_o \cdot [h_{t-1},\, x_t] + b_o\right)`} />
        <div style={{ fontSize: 11, color: '#475569', marginTop: -6, marginBottom: 10, paddingLeft: 4 }}>
          Output gate — controls what portion of cell state becomes the hidden state
        </div>
      </Sec>

      {/* 3. Cell State */}
      <Sec title="3. Cell State Update" color="#8B5CF6" delay={0.15}>
        <P>
          The cell state is updated by first erasing irrelevant history (scaled by <InlineMath tex="f_t" />),
          then absorbing new candidate values (scaled by <InlineMath tex="i_t" />):
        </P>
        <BlockMath tex={String.raw`C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 8 }}>
          {[
            { cond: <InlineMath tex="f_t \approx 1,\; i_t \approx 0" />, label: 'Cell state preserved — long-term memory', color: '#10B981' },
            { cond: <InlineMath tex="f_t \approx 0" />,                  label: 'Past memory erased (hard reset)',          color: '#F87171' },
            { cond: <InlineMath tex="i_t \approx 1" />,                  label: 'New information fully absorbed',           color: '#00E5FF' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px',
              border: `1px solid ${c.color}18` }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{c.cond}</div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </Sec>

      {/* 4. Hidden State */}
      <Sec title="4. Hidden State Output" color="#10B981" delay={0.2}>
        <P>
          The hidden state <InlineMath tex="h_t" /> is the "working memory" — a filtered version of the
          cell state exposed to downstream layers:
        </P>
        <BlockMath tex={String.raw`h_t = o_t \odot \tanh(C_t)`} />
        <P>
          The output gate <InlineMath tex="o_t" /> controls which aspects of <InlineMath tex="C_t" /> to
          reveal. This allows the LSTM to maintain rich internal state without exposing it unnecessarily
          to the output.
        </P>
      </Sec>

      {/* 5. Activation Functions */}
      <Sec title="5. Activation Functions" color="#F59E0B" delay={0.25}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 700, color: '#00E5FF', marginBottom: 8 }}>Sigmoid</div>
            <BlockMath tex={String.raw`\sigma(z) = \frac{1}{1 + e^{-z}} \in (0, 1)`} />
            <div style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>
              Used for all three gates. Maps to (0,1) so gates act as soft binary switches.
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 700, color: '#8B5CF6', marginBottom: 8 }}>Hyperbolic Tangent</div>
            <BlockMath tex={String.raw`\tanh(z) = \frac{e^z - e^{-z}}{e^z + e^{-z}} \in (-1, 1)`} />
            <div style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>
              Used for candidate and hidden state. Zero-centred — avoids bias shift.
            </div>
          </div>
        </div>
      </Sec>

      {/* 6. Explainability Metrics */}
      <Sec title="6. Explainability Metrics" color="#A78BFA" delay={0.3}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA', marginBottom: 6 }}>Gate Contribution</div>
          <P>
            Normalized mean activation of each gate across all timesteps.
            Higher value = greater influence on model behaviour.
          </P>
          <BlockMath tex={String.raw`\text{contrib}(g) = \frac{\overline{g_t}}{\displaystyle\sum_{g'} \overline{g'_t}}, \qquad \overline{g_t} = \frac{1}{T}\sum_{t=1}^{T} g_t`} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA', marginBottom: 6 }}>Memory Persistence</div>
          <P>
            Autocorrelation of the cell-state norm <InlineMath tex="\|C_t\|" /> across lags.
            High autocorrelation means LSTM retains memory for many steps.
          </P>
          <BlockMath tex={String.raw`\rho(k) = \operatorname{Corr}\!\left(\|C_t\|,\, \|C_{t+k}\|\right)`} />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA', marginBottom: 6 }}>Counterfactual (Linear Approximation)</div>
          <P>
            If gate <InlineMath tex="g" /> at time <InlineMath tex="t" /> had value <InlineMath tex="v'" />,
            the approximate new prediction is:
          </P>
          <BlockMath tex={String.raw`\hat{y}'_t \;\approx\; \hat{y}_t + \underbrace{(v' - g_t)}_{\Delta g} \cdot \alpha_g \cdot \bigl(1 - |y_t - 0.5|\bigr)`} />
          <P>
            where <InlineMath tex="\alpha_g" /> is a gate-specific sensitivity coefficient
            (forget: 0.38, input: 0.32, output: 0.45).
          </P>
        </div>
      </Sec>

    </div>
  )
}
