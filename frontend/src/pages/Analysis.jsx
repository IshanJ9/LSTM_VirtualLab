import { useState, useEffect } from 'react'
import { getAnalysis } from '../services/api'
import AnalysisPanel from '../components/AnalysisPanel'
import { motion } from 'framer-motion'

const DATASETS = [
  { id: 'sine',       label: 'Sine Wave',       color: '#00E5FF' },
  { id: 'noisy',      label: 'Noisy Signal',     color: '#8B5CF6' },
  { id: 'text',       label: 'Char Sequence',    color: '#F59E0B' },
  { id: 'long-range', label: 'Long-Range Dep.',  color: '#10B981' },
]

export default function Analysis() {
  const [dataset,  setDataset]  = useState('sine')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    getAnalysis(dataset)
      .then(setData)
      .catch(() => setError('Backend unavailable. Start the API server first.'))
      .finally(() => setLoading(false))
  }, [dataset])

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,229,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, background: '#0a0e17' }}>
        <div>
          <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.15em' }}>DEEP ANALYSIS</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>Gate Contribution & Memory Study</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {DATASETS.map(d => (
            <button key={d.id} onClick={() => setDataset(d.id)} style={{
              padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
              border: `1px solid ${dataset===d.id ? d.color+'66' : 'rgba(255,255,255,0.07)'}`,
              background: dataset===d.id ? d.color+'14' : 'transparent',
              color: dataset===d.id ? d.color : '#64748B', fontWeight: dataset===d.id ? 600 : 400,
              transition: 'all 0.15s',
            }}>{d.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E5FF', fontSize: 13 }}>
            ⟳ Loading analysis…
          </div>
        )}
        {error && !loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#F87171', fontSize: 13, background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '16px 24px' }}>
              ⚠ {error}
            </div>
          </div>
        )}
        {!loading && !error && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnalysisPanel analysisData={data}/>
          </div>
        )}
      </div>
    </div>
  )
}
