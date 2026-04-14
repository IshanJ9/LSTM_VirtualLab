import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Gate color: 0 → dark steel, 0.5 → cyan, 1.0 → violet
function gateColor(v = 0.5) {
  const clamped = Math.max(0, Math.min(1, v))
  const r = Math.round(clamped > 0.5 ? ((clamped - 0.5) * 2) * 139 : 0)
  const g = Math.round(clamped < 0.5 ? clamped * 2 * 229 : (1 - (clamped - 0.5) * 2) * 229)
  const b = Math.round(clamped < 0.5 ? clamped * 2 * 255 : 246)
  return `rgb(${r},${g},${b})`
}

function gateAlpha(v = 0.5) { return `${gateColor(v)}88` }
function gateBorder(v = 0.5) { return `${gateColor(v)}cc` }

const GATE_META = {
  forget_gate:  { name: 'Forget Gate',    sym: 'f',  note: (v) => `Retains ${(v*100).toFixed(0)}% of past memory` },
  input_gate:   { name: 'Input Gate',     sym: 'i',  note: (v) => `Absorbs ${(v*100).toFixed(0)}% of new information` },
  candidate:    { name: 'Candidate',      sym: 'g',  note: (v) => `Proposes ${v.toFixed(3)} to cell state` },
  output_gate:  { name: 'Output Gate',    sym: 'o',  note: (v) => `Outputs ${(v*100).toFixed(0)}% of cell content` },
}

export default function LSTMVisualizer({ data, playing }) {
  const [hovered, setHovered] = useState(null)
  const [clicked, setClicked] = useState(null)

  const f  = data?.forget_gate  ?? 0.5
  const ig = data?.input_gate   ?? 0.5
  const og = data?.output_gate  ?? 0.5
  const cd = data?.candidate    ?? 0.5
  const cs = data?.cell_state   ?? Array(8).fill(0)
  const hs = data?.hidden_state ?? Array(8).fill(0)

  // Cell state norm for bar fill
  const csNorm = Math.max(...cs.map(Math.abs), 0.01)
  const csBar = cs.map(v => v / csNorm)

  const W = 860, H = 420
  // Key positions
  const CELL_Y = 90
  const GATE_Y = 250
  const INPUT_Y = 380
  const FORGET_X = 180, INPUT_X = 360, CAND_X = 510, OUTPUT_X = 660
  const MULT1_X = 270, ADD_X = 450, MULT2_X = 750
  const BOX_W = 110, BOX_H = 76

  const gates = [
    { key: 'forget_gate', val: f,  x: FORGET_X, sym: 'σ',  label: 'FORGET', acFn: 'sigmoid' },
    { key: 'input_gate',  val: ig, x: INPUT_X,  sym: 'σ',  label: 'INPUT',  acFn: 'sigmoid' },
    { key: 'candidate',   val: cd, x: CAND_X,   sym: 'tanh', label: 'CAND',  acFn: 'tanh' },
    { key: 'output_gate', val: og, x: OUTPUT_X, sym: 'σ',  label: 'OUTPUT', acFn: 'sigmoid' },
  ]

  const tooltip = hovered ? GATE_META[hovered.key] : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}>
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && tooltip && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: '#0f1b2d', border: `1px solid ${gateBorder(hovered.val)}`,
              borderRadius: 9, padding: '10px 16px', zIndex: 20, pointerEvents: 'none',
              boxShadow: `0 0 20px ${gateColor(hovered.val)}33`,
              fontSize: 12, color: '#E2E8F0', minWidth: 220, textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, color: gateColor(hovered.val), marginBottom: 4 }}>{tooltip.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: gateColor(hovered.val), marginBottom: 4 }}>
              {hovered.val.toFixed(4)}
            </div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>{tooltip.note(hovered.val)}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" overflow="visible">
        <defs>
          <filter id="glow-c"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="cell-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7"/>
          </linearGradient>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#00E5FF44" />
          </marker>
        </defs>

        {/* Background cell border */}
        <rect x={80} y={40} width={700} height={300} rx={16}
          fill="rgba(0,229,255,0.02)" stroke="rgba(0,229,255,0.12)" strokeWidth={1} />

        {/* ── CELL STATE HIGHWAY ── */}
        <text x={90} y={CELL_Y - 10} fontSize={10} fill="#64748B" letterSpacing="1">C STATE</text>
        {/* Background track */}
        <rect x={90} y={CELL_Y} width={660} height={22} rx={4} fill="rgba(0,0,0,0.4)" stroke="rgba(0,229,255,0.08)" strokeWidth={1}/>
        {/* Segmented cell state bars */}
        {cs.map((v, i) => (
          <rect key={i}
            x={90 + i * (660/8)} y={CELL_Y} width={(660/8)-2} height={22} rx={2}
            fill={`rgba(${v>0?0:139},${v>0?229:92},${v>0?255:246},${Math.min(Math.abs(v)*0.9,0.85)})`}
          />
        ))}
        <text x={756} y={CELL_Y+15} fontSize={9} fill="#475569">C_t →</text>
        <text x={54} y={CELL_Y+15} fontSize={9} fill="#475569">← C_{'{t-1}'}</text>

        {/* ⊗ forget multiply */}
        <circle cx={MULT1_X} cy={CELL_Y+11} r={12} fill="#0a111d" stroke={gateBorder(f)} strokeWidth={1.5}/>
        <text x={MULT1_X} y={CELL_Y+16} textAnchor="middle" fontSize={14} fill={gateColor(f)}>⊗</text>

        {/* ⊕ add gate */}
        <circle cx={ADD_X} cy={CELL_Y+11} r={12} fill="#0a111d" stroke="rgba(0,229,255,0.4)" strokeWidth={1.5}/>
        <text x={ADD_X} y={CELL_Y+16} textAnchor="middle" fontSize={14} fill="#00E5FF">⊕</text>

        {/* ⊗ output multiply */}
        <circle cx={MULT2_X} cy={GATE_Y} r={12} fill="#0a111d" stroke={gateBorder(og)} strokeWidth={1.5}/>
        <text x={MULT2_X} y={GATE_Y+5} textAnchor="middle" fontSize={14} fill={gateColor(og)}>⊗</text>

        {/* Connection lines */}
        {/* from forget box to ⊗ */}
        <line x1={FORGET_X} y1={GATE_Y - BOX_H/2} x2={FORGET_X} y2={CELL_Y+23} stroke={gateColor(f)} strokeWidth={1.2} strokeOpacity={0.5}/>
        <line x1={FORGET_X} y1={CELL_Y+23} x2={MULT1_X} y2={CELL_Y+23} stroke={gateColor(f)} strokeWidth={1.2} strokeOpacity={0.5}/>

        {/* from input+cand to ⊕ */}
        <line x1={INPUT_X} y1={GATE_Y - BOX_H/2} x2={INPUT_X} y2={ADD_X > INPUT_X ? CELL_Y+23 : CELL_Y+23} stroke={gateColor(ig)} strokeWidth={1.2} strokeOpacity={0.5}/>
        <line x1={CAND_X}  y1={GATE_Y - BOX_H/2} x2={CAND_X}  y2={CELL_Y+30} stroke={gateColor(cd)} strokeWidth={1.2} strokeOpacity={0.4}/>
        <line x1={INPUT_X} y1={CELL_Y+23} x2={ADD_X}  y2={CELL_Y+23} stroke="rgba(0,229,255,0.35)" strokeWidth={1.2}/>
        <line x1={CAND_X}  y1={CELL_Y+30} x2={ADD_X}  y2={CELL_Y+30} stroke="rgba(0,229,255,0.25)" strokeWidth={1.2}/>

        {/* from output gate to ⊗mult2 */}
        <line x1={OUTPUT_X} y1={GATE_Y - BOX_H/2} x2={OUTPUT_X} y2={GATE_Y - 40} stroke={gateColor(og)} strokeWidth={1.2} strokeOpacity={0.5}/>
        <line x1={OUTPUT_X} y1={GATE_Y - 40} x2={MULT2_X} y2={GATE_Y - 40} stroke={gateColor(og)} strokeWidth={1.2} strokeOpacity={0.5}/>
        <line x1={MULT2_X}  y1={GATE_Y - 40} x2={MULT2_X} y2={GATE_Y - 12} stroke={gateColor(og)} strokeWidth={1.2} strokeOpacity={0.5}/>

        {/* tanh(C) to ⊗mult2 */}
        <line x1={620} y1={CELL_Y+11} x2={700} y2={CELL_Y+11} stroke="rgba(139,92,246,0.4)" strokeWidth={1}/>
        <line x1={700} y1={CELL_Y+11} x2={700} y2={GATE_Y} stroke="rgba(139,92,246,0.4)" strokeWidth={1}/>
        <line x1={700} y1={GATE_Y}    x2={MULT2_X-12} y2={GATE_Y} stroke="rgba(139,92,246,0.4)" strokeWidth={1}/>

        {/* h_t-1 input */}
        <line x1={80} y1={INPUT_Y} x2={780} y2={INPUT_Y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth={1}/>
        <text x={50} y={INPUT_Y+4} fontSize={9} fill="#475569">h,x →</text>

        {/* Input lines from combined to each gate */}
        {gates.map(g => (
          <line key={g.key} x1={g.x} y1={INPUT_Y} x2={g.x} y2={GATE_Y + BOX_H/2}
            stroke={gateColor(g.val)} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 3"/>
        ))}

        {/* h_t output */}
        <line x1={MULT2_X+12} y1={GATE_Y} x2={800} y2={GATE_Y} stroke={gateColor(og)} strokeWidth={1.5} strokeOpacity={0.6}/>
        <text x={806} y={GATE_Y+4} fontSize={9} fill="#94A3B8">h_t</text>

        {/* Animated particles on main cell state when playing */}
        {playing && [0, 0.3, 0.6].map((delay, i) => (
          <circle key={i} r={3} fill="#00E5FF" opacity={0.8} filter="url(#glow-c)">
            <animateMotion dur="1.8s" begin={`${delay}s`} repeatCount="indefinite"
              path={`M 90 ${CELL_Y+11} L 750 ${CELL_Y+11}`} />
            <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Gate Boxes */}
        {gates.map(g => {
          const isHov = hovered?.key === g.key
          const isClick = clicked?.key === g.key
          const col = gateColor(g.val)
          const bx = g.x - BOX_W / 2, by = GATE_Y - BOX_H / 2
          return (
            <g key={g.key} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered({ key: g.key, val: g.val })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setClicked(isClick ? null : { key: g.key, val: g.val })}
            >
              {/* Shadow glow */}
              {(isHov || isClick) && (
                <rect x={bx-4} y={by-4} width={BOX_W+8} height={BOX_H+8} rx={14}
                  fill="none" stroke={col} strokeWidth={1} strokeOpacity={0.5}
                  filter="url(#glow-c)" />
              )}
              {/* Box */}
              <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx={10}
                fill={`${col}14`} stroke={col} strokeWidth={isHov||isClick ? 1.5 : 1} strokeOpacity={isHov||isClick ? 0.9 : 0.5}/>
              {/* Activation fill bar */}
              <rect x={bx+4} y={by + BOX_H - 14} width={(BOX_W-8) * g.val} height={6} rx={3}
                fill={col} opacity={0.6}/>
              {/* Label */}
              <text x={g.x} y={by+20} textAnchor="middle" fontSize={9} fill={col} fontWeight="600" letterSpacing="1">{g.label}</text>
              <text x={g.x} y={by+34} textAnchor="middle" fontSize={18} fill={col} opacity={0.7}>{g.sym === 'tanh' ? 'tanh' : 'σ'}</text>
              <text x={g.x} y={by+52} textAnchor="middle" fontSize={13}
                fill={col} fontFamily="JetBrains Mono, monospace" fontWeight="500">{g.val.toFixed(3)}</text>
            </g>
          )
        })}

        {/* Hidden state bars (bottom) */}
        <text x={90} y={H - 28} fontSize={10} fill="#64748B" letterSpacing="1">HIDDEN STATE (h_t)</text>
        {hs.map((v, i) => (
          <g key={i}>
            <rect x={90 + i*(660/8)} y={H-20} width={(660/8)-2} height={14} rx={2}
              fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.2)" strokeWidth={0.5}/>
            <rect x={90 + i*(660/8)} y={H-20 + (v<0?14*(1+v):14*(1-v))} width={(660/8)-2}
              height={Math.abs(v)*14} rx={2}
              fill={`rgba(139,92,246,${Math.min(0.9,Math.abs(v)*0.9)})`}/>
          </g>
        ))}
      </svg>

      {/* Clicked deep-dive panel */}
      <AnimatePresence>
        {clicked && (
          <motion.div
            key="deepdive"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: 20, right: 10,
              background: '#0f1b2d', border: `1px solid ${gateBorder(clicked.val)}`,
              borderRadius: 12, padding: '14px 18px', width: 200,
              boxShadow: `0 0 24px ${gateColor(clicked.val)}22`,
            }}
          >
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>DEEP ANALYSIS</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: gateColor(clicked.val), marginBottom: 8 }}>
              {GATE_META[clicked.key]?.name}
            </div>
            <ValueRow label="Activation" value={clicked.val.toFixed(5)} color={gateColor(clicked.val)}/>
            <ValueRow label="Effect" value={GATE_META[clicked.key]?.note(clicked.val)} color="#94A3B8" small/>
            <ValueRow label="Activation Fn" value={clicked.key === 'candidate' ? 'tanh' : 'sigmoid'} color="#8B5CF6"/>
            <ValueRow label="Input" value={data?.input?.toFixed(4)} color="#64748B"/>
            <button onClick={() => setClicked(null)}
              style={{ marginTop: 10, width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#64748B',
                fontSize: 11, cursor: 'pointer', padding: '4px 0' }}>Close ✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ValueRow({ label, value, color, small }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: '#475569' }}>{label}</div>
      <div style={{ fontSize: small ? 10 : 12, color, fontFamily: small ? 'inherit' : 'JetBrains Mono, monospace', lineHeight: 1.3 }}>{value}</div>
    </div>
  )
}
