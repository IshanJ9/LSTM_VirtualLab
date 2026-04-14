import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const LINKS = [
  { to: '/aim',        label: 'Aim' },
  { to: '/objectives', label: 'Objectives' },
  { to: '/theory',     label: 'Theory' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/analysis',   label: 'Analysis' },
  { to: '/quiz',       label: 'Quiz' },
]

export default function Navbar() {
  return (
    <nav style={{
      background: 'rgba(15,22,35,0.95)',
      borderBottom: '1px solid rgba(0,229,255,0.15)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 0 30px rgba(0,229,255,0.06)',
    }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 48, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00E5FF22, #8B5CF622)',
            border: '1px solid rgba(0,229,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🧠</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: '#E2E8F0' }}>
            XAI-<span style={{ color: '#00E5FF' }}>LSTM</span> Lab
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{ position: 'relative', padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                  background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#00E5FF' : '#94A3B8',
                    transition: 'color 0.2s',
                  }}>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: 'absolute', bottom: -1, left: 8, right: 8, height: 2,
                        background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)',
                        borderRadius: 2,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#10B981',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block',
            boxShadow: '0 0 8px #10B981', animation: 'pulse-glow 2s infinite' }} />
          RESEARCH MODE
        </div>
      </div>
    </nav>
  )
}
