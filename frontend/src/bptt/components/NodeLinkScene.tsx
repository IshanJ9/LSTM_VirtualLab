import { useMemo } from 'react'

interface NodeLinkSceneProps {
  values: string[]
  contributions?: number[]
  forwardIndex: number
  backwardIndex?: number | null
  compactNodes?: boolean
  curvedEdges?: boolean
  forwardHighlightTone?: 'blue' | 'gold'
  showDualCurves?: boolean
  predictionBoxWidth?: number
  predictionBoxHeight?: number
  timelineWidth?: number
  predictionLabel?: string
  actualLabel?: string
  showError?: boolean
  showOutput?: boolean
  outputNodeLabel?: string
  lossRatio?: number
}

function edgeStrength(contributionA: number, contributionB: number): number {
  return Math.max(1.6, (contributionA + contributionB) * 2.6)
}

export default function NodeLinkScene({
  values,
  contributions,
  forwardIndex,
  backwardIndex,
  compactNodes = false,
  curvedEdges = false,
  forwardHighlightTone = 'blue',
  showDualCurves = false,
  predictionBoxWidth,
  predictionBoxHeight,
  timelineWidth,
  predictionLabel,
  actualLabel,
  showError = false,
  showOutput = false,
  outputNodeLabel = 'y_hat',
  lossRatio,
}: NodeLinkSceneProps) {
  const width = timelineWidth || 1000
  const height = 250
  const nodeCount = values.length

  const points = useMemo(() => {
    if (!nodeCount) return []
    return values.map((_, idx) => {
      const x = nodeCount === 1 ? width / 2 : 90 + (idx * (width - 180)) / (nodeCount - 1)
      const y = 104
      return { x, y }
    })
  }, [nodeCount, values])

  const safeContributions = useMemo(() => {
    if (!values.length) return []
    if (!contributions || contributions.length !== values.length) {
      return values.map((_, idx) => (idx + 1) / values.length)
    }
    return contributions
  }, [contributions, values])

  const outputX = width - 50
  const outputY = 104
  const outputWidth = predictionBoxWidth || 62
  const outputHeight = predictionBoxHeight || 62

  const buildCurvePath = (startX: number, startY: number, endX: number, endY: number, rise = 24) => {
    const controlX = (startX + endX) / 2
    const controlY = startY - rise
    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
  }

  const buildLowerCurvePath = (startX: number, startY: number, endX: number, endY: number, depth = 24) => {
    const controlX = (startX + endX) / 2
    const controlY = startY + depth
    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
  }

  return (
    <div className={`scene-shell ${compactNodes ? 'compact' : ''} ${forwardHighlightTone === 'gold' ? 'gold-forward' : ''}`}>
      <div className="scene-graph">
        <svg className="scene-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
          {points.map((point, idx) => {
            if (idx === points.length - 1) return null
            const next = points[idx + 1]
            const forwardActive = idx < forwardIndex
            const backwardActive = backwardIndex !== null && backwardIndex !== undefined && idx >= backwardIndex
            const strength = edgeStrength(safeContributions[idx], safeContributions[idx + 1])
            const path = buildCurvePath(point.x, point.y, next.x, next.y, curvedEdges ? 18 : 8)
            const backwardPath = buildLowerCurvePath(point.x, point.y, next.x, next.y, curvedEdges ? 18 : 8)

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={path}
                  className={`edge ${backwardActive ? 'backward' : forwardActive ? 'forward' : ''}`}
                  style={{ strokeWidth: backwardActive ? strength : 2 }}
                />
                {(forwardActive || backwardActive) && (
                  <path d={path} className={`wave ${backwardActive ? 'backward' : 'forward'}`} />
                )}
                {showDualCurves && (forwardActive || backwardActive) && (
                  <>
                    <path
                      d={backwardPath}
                      className={`edge ${backwardActive ? 'backward' : ''}`}
                      style={{ strokeWidth: backwardActive ? strength * 0.95 : 1.6, opacity: backwardActive ? 1 : 0.3 }}
                    />
                    <path d={backwardPath} className={`wave backward`} style={{ opacity: backwardActive ? 1 : 0.2 }} />
                  </>
                )}
              </g>
            )
          })}

          {showOutput && points.length > 0 && (
            <>
              <line
                x1={points[points.length - 1].x + 30}
                y1={points[points.length - 1].y}
                x2={outputX - outputWidth / 2 + 12}
                y2={outputY}
                className={`edge ${forwardIndex >= values.length ? 'forward' : ''}`}
              />
              {forwardIndex >= values.length && (
                <line
                  x1={points[points.length - 1].x + 30}
                  y1={points[points.length - 1].y}
                  x2={outputX - outputWidth / 2 + 12}
                  y2={outputY}
                  className="wave forward"
                />
              )}
              <rect
                x={outputX - outputWidth / 2}
                y={outputY - outputHeight / 2}
                width={outputWidth}
                height={outputHeight}
                rx="20"
                ry="20"
                className={`node ${showError ? 'active-backward' : forwardIndex >= values.length ? 'active-forward' : ''}`}
                style={{ transform: showError ? 'translateY(-2px)' : 'translateY(0)' }}
              />
              <text x={outputX} y={outputY - 4} textAnchor="middle" fill="#eaf4ff" fontSize="12" fontWeight={700}>
                {outputNodeLabel}
              </text>
              {predictionLabel && (
                <text
                  x={outputX}
                  y={outputY + 12}
                  textAnchor="middle"
                  fill="#f5c542"
                  fontSize={predictionLabel.length > 10 ? 10 : 12}
                  fontWeight={700}
                >
                  {predictionLabel}
                </text>
              )}
            </>
          )}
        </svg>

        <div className="scene-row">
          {values.map((value, idx) => {
            const forwardActive = idx <= forwardIndex
            const backwardActive = backwardIndex !== null && backwardIndex !== undefined && idx >= backwardIndex
            return (
              <div className="node-wrap" key={`node-${idx}`}>
                <div
                  className={`node ring ${forwardActive ? 'active-forward' : ''} ${backwardActive ? 'active-backward' : ''} ${forwardHighlightTone === 'gold' && forwardActive && !backwardActive ? 'tone-gold' : ''}`}
                  style={{ ['--contribution' as string]: `${safeContributions[idx]}` }}
                >
                  {value}
                </div>
                <div className="node-label">x{idx + 1}</div>
                <div className="contrib" title={`Contribution: ${(safeContributions[idx] * 100).toFixed(0)}%`}>
                  <span style={{ width: `${safeContributions[idx] * 100}%`, opacity: 0.45 + safeContributions[idx] * 0.55 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(showOutput || predictionLabel || actualLabel) && (
        <div className="scene-output">
          {predictionLabel && <div className="pill ok">Prediction: {predictionLabel}</div>}
          {actualLabel && <div className="pill">Actual: {actualLabel}</div>}
          {showError && <div className="pill alert">The model made a mistake.</div>}
          {typeof lossRatio === 'number' && (
            <div className="pill" style={{ minWidth: 230 }}>
              Loss gap
              <div className="loss-bar">
                <span style={{ width: `${Math.min(100, Math.max(4, lossRatio * 100))}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
