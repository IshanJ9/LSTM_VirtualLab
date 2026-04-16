import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import jsPDF from 'jspdf'

const QUESTIONS = [
  {
    q: 'What does the Forget Gate primarily control in an LSTM?',
    options: ['Adding new information to the cell', 'How much past memory to retain', 'Scaling the output activation', 'Normalizing input features'],
    ans: 1,
    exp: 'The forget gate outputs values in (0,1). Close to 1 = retain, close to 0 = erase past cell state.',
  },
  {
    q: 'Which activation function is used for all three LSTM gates (forget, input, output)?',
    options: ['ReLU', 'Tanh', 'Sigmoid', 'Softmax'],
    ans: 2,
    exp: 'Sigmoid maps values to (0,1), making it ideal for binary "how much to pass" gating decisions.',
  },
  {
    q: 'What is the role of the Cell State (C_t) in LSTM?',
    options: ['Stores short-term activations only', 'Acts as a long-term memory highway', 'Controls output dimensions', 'Normalizes hidden states'],
    ans: 1,
    exp: 'The cell state is a dedicated highway that carries information far through time with minimal modification.',
  },
  {
    q: 'The vanishing gradient problem occurs when…',
    options: ['Learning rate is too high', 'Gradients shrink exponentially during backpropagation', 'Too many hidden units are used', 'Loss function is undefined'],
    ans: 1,
    exp: 'In RNNs, repeated multiplication of Jacobians with eigenvalues < 1 causes gradients to vanish.',
  },
  {
    q: 'A Forget Gate value close to 0.0 means…',
    options: ['All past memory is retained', 'Past cell state is erased', 'New input is blocked', 'Output is zero'],
    ans: 1,
    exp: 'C_t = f_t ⊙ C_{t-1} + … When f_t ≈ 0, the past cell state is multiplied by ~0, effectively erasing it.',
  },
  {
    q: 'The Hidden State (h_t) is computed as…',
    options: ['h_t = tanh(C_t)', 'h_t = o_t ⊙ tanh(C_t)', 'h_t = f_t ⊙ C_t', 'h_t = i_t ⊙ g_t'],
    ans: 1,
    exp: 'The output gate o_t filters which parts of the cell state tanh(C_t) to expose as hidden state h_t.',
  },
  {
    q: 'In the Long-Range Dependency dataset, what makes learning difficult?',
    options: ['High noise level', 'Non-periodic patterns', 'Large time delay between input and target output', 'Variable sequence length'],
    ans: 2,
    exp: 'The target output equals input from 10 steps ago. The LSTM must store information reliably for 10 steps.',
  },
  {
    q: 'Memory Persistence Score in LSTM Lab is computed from…',
    options: ['Gate weight magnitudes', 'Autocorrelation of ‖C_t‖ over lags', 'MSE loss over time', 'Hidden state entropy'],
    ans: 1,
    exp: 'Autocorrelation of the cell state norm measures how long past information continues to influence future states.',
  },
  {
    q: 'Gate Contribution analysis is useful for…',
    options: ['Regularizing the training loss', 'Understanding relative gate influence on predictions', 'Resetting cell states at inference', 'Data preprocessing'],
    ans: 1,
    exp: 'Normalized mean gate activation shows which gate dominates the model\'s behavior for a given dataset.',
  },
  {
    q: 'Counterfactual simulation helps to…',
    options: ['Generate new training data', 'Speed up batch inference', 'Explore "what if" scenarios by modifying gate values', 'Reduce model parameters'],
    ans: 2,
    exp: 'By changing a gate value and recomputing the output, we gain causal insight into gate influence on predictions.',
  },
]

function ScoreBar({ score, total }) {
  const pct = score / total
  const color = pct >= 0.8 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#F87171'
  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct*100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 4 }}/>
      </div>
    </div>
  )
}

export default function Quiz() {
  const [name,    setName]    = useState('')
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [current, setCurrent] = useState(0)

  const score = submitted ? QUESTIONS.reduce((acc, _, i) => acc + (answers[i] === QUESTIONS[i].ans ? 1 : 0), 0) : 0
  const pct = score / QUESTIONS.length

  const downloadCert = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = 297, H = 210

    // Background
    doc.setFillColor(11, 15, 20)
    doc.rect(0, 0, W, H, 'F')

    // Border frame
    doc.setDrawColor(0, 229, 255)
    doc.setLineWidth(0.5)
    doc.rect(8, 8, W-16, H-16)
    doc.setLineWidth(0.2)
    doc.rect(12, 12, W-24, H-24)

    // Header
    doc.setTextColor(0, 229, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('LSTM LAB', W/2, 30, { align: 'center' })

    doc.setTextColor(200, 220, 240)
    doc.setFontSize(22)
    doc.text('Certificate of Achievement', W/2, 50, { align: 'center' })

    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139)
    doc.text('This certifies that', W/2, 70, { align: 'center' })

    // Name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(name || 'Student', W/2, 90, { align: 'center' })

    // Line under name
    doc.setDrawColor(0, 229, 255)
    doc.setLineWidth(0.3)
    doc.line(W/2 - 50, 94, W/2 + 50, 94)

    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text('has successfully completed the LSTM Lab Assessment', W/2, 110, { align: 'center' })

    // Score
    doc.setTextColor(0, 229, 255)
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text(`${score} / ${QUESTIONS.length}`, W/2, 135, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(139, 92, 246)
    const grade = pct >= 0.9 ? 'Distinction' : pct >= 0.7 ? 'Merit' : pct >= 0.5 ? 'Pass' : 'Attempted'
    doc.text(grade, W/2, 145, { align: 'center' })

    // Date
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(`Issued: ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, W/2, 165, { align: 'center' })
    doc.text('LSTM Lab · Interactive Visual Analytics for Interpretable Sequential Modeling', W/2, 173, { align: 'center' })

    doc.save(`LSTM-Certificate-${name.replace(/\s/g,'_') || 'Student'}.pdf`)
  }

  /* Name entry screen */
  if (!started) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        style={{ background: '#0f1623', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 20,
          padding: '48px 56px', maxWidth: 480, width: '100%', textAlign: 'center',
          boxShadow: '0 0 60px rgba(0,229,255,0.08)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E2E8F0', margin: '0 0 8px' }}>LSTM Knowledge Quiz</h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 }}>
          10 scenario-based questions. Enter your name to begin — it will appear on your certificate.
        </p>

        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Your full name"
          onKeyDown={e => e.key === 'Enter' && name.trim() && setStarted(true)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,255,0.2)',
            color: '#E2E8F0', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif',
          }}
        />

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => name.trim() && setStarted(true)}
          disabled={!name.trim()}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10, cursor: name.trim() ? 'pointer' : 'not-allowed',
            background: name.trim() ? 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${name.trim() ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
            color: name.trim() ? '#00E5FF' : '#475569', fontWeight: 700, fontSize: 14,
            transition: 'all 0.2s',
          }}>Start Quiz →</motion.button>

        <div style={{ fontSize: 11, color: '#334155', marginTop: 16 }}>10 questions · Instant feedback · PDF certificate</div>
      </motion.div>
    </div>
  )

  /* Results screen */
  if (submitted) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background: '#0f1623', border: `1px solid ${pct>=0.8?'rgba(16,185,129,0.3)':pct>=0.5?'rgba(245,158,11,0.3)':'rgba(248,113,113,0.3)'}`,
          borderRadius: 20, padding: '40px 48px', maxWidth: 680, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{pct>=0.8?'🏆':pct>=0.5?'🎯':'📚'}</div>
        <div style={{ fontSize: 11, color: '#64748B', letterSpacing: '0.1em', marginBottom: 6 }}>QUIZ COMPLETE</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: pct>=0.8?'#10B981':pct>=0.5?'#F59E0B':'#F87171', fontFamily: 'JetBrains Mono, monospace' }}>
          {score} / {QUESTIONS.length}
        </div>
        <ScoreBar score={score} total={QUESTIONS.length}/>
        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 28 }}>
          {pct >= 0.9 ? 'Outstanding! Deep LSTM mastery.' : pct >= 0.7 ? 'Great work! Solid understanding.' : pct >= 0.5 ? 'Good effort. Review the Theory section.' : 'Keep learning! Revisit the Theory and Simulation pages.'}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <button onClick={downloadCert} style={{
            padding: '11px 24px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13,
            background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF',
          }}>⬇ Download Certificate</button>
          <button onClick={() => { setAnswers({}); setSubmitted(false); setCurrent(0) }} style={{
            padding: '11px 24px', borderRadius: 9, cursor: 'pointer', fontSize: 13,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748B',
          }}>↺ Retry Quiz</button>
        </div>

        {/* Answer review */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: '#64748B', letterSpacing: '0.1em', marginBottom: 12 }}>REVIEW</div>
          {QUESTIONS.map((q, i) => {
            const correct = answers[i] === q.ans
            return (
              <div key={i} style={{ borderRadius: 9, padding: '10px 14px', marginBottom: 8,
                background: correct ? 'rgba(16,185,129,0.05)' : 'rgba(248,113,113,0.05)',
                border: `1px solid ${correct ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)'}` }}>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>{i+1}. {q.q}</div>
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: correct?'#10B981':'#F87171' }}>{correct?'✓ Correct':'✗ Incorrect'}</span>
                  {!correct && <span style={{ color: '#64748B', marginLeft: 8 }}>Answer: {q.options[q.ans]}</span>}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4, lineHeight: 1.5 }}>{q.exp}</div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )

  /* Question screen */
  const q = QUESTIONS[current]
  const chosen = answers[current]
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>{name} · Question {current+1} of {QUESTIONS.length}</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#00E5FF' }}>{Object.keys(answers).length} answered</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <motion.div animate={{ width: `${((current+1)/QUESTIONS.length)*100}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#00E5FF,#8B5CF6)', borderRadius: 2 }}/>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
            style={{ background: '#0f1623', border: '1px solid rgba(0,229,255,0.12)', borderRadius: 18, padding: '32px 36px' }}>
            <div style={{ fontSize: 15, color: '#E2E8F0', fontWeight: 600, marginBottom: 24, lineHeight: 1.55 }}>
              <span style={{ color: '#00E5FF', fontFamily: 'monospace', marginRight: 10 }}>Q{current+1}.</span>
              {q.q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.options.map((opt, oi) => (
                <motion.button key={oi} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => setAnswers(a => ({ ...a, [current]: oi }))}
                  style={{
                    padding: '12px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `1px solid ${chosen===oi ? 'rgba(0,229,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                    background: chosen===oi ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.02)',
                    color: chosen===oi ? '#E2E8F0' : '#64748B', fontSize: 13,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontFamily: 'monospace', color: chosen===oi?'#00E5FF':'#475569', marginRight: 10 }}>
                    {['A','B','C','D'][oi]}.
                  </span>
                  {opt}
                </motion.button>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
              <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current===0}
                style={{ padding: '9px 20px', borderRadius: 8, cursor: current===0?'default':'pointer',
                  border: '1px solid rgba(255,255,255,0.07)', background: 'transparent',
                  color: current===0?'#334155':'#64748B', fontSize: 12 }}>← Prev</button>

              {current < QUESTIONS.length - 1 ? (
                <button onClick={() => setCurrent(c => c+1)}
                  style={{ padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.1)',
                    color: '#00E5FF', fontSize: 12, fontWeight: 600 }}>Next →</button>
              ) : (
                <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < QUESTIONS.length}
                  style={{ padding: '9px 20px', borderRadius: 8,
                    cursor: Object.keys(answers).length < QUESTIONS.length ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.15)',
                    color: '#8B5CF6', fontSize: 12, fontWeight: 700,
                    opacity: Object.keys(answers).length < QUESTIONS.length ? 0.5 : 1 }}>
                  Submit Quiz ✓
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
