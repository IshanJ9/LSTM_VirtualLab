import { useMemo } from 'react'
import { clamp } from '../utils'

interface StageThreeNodeLinkSceneProps {
  values: string[]
  contributions?: number[]
  forwardIndex: number
  backwardIndex?: number | null
  predictionLabel?: string
  predictionLabelDenorm?: string
  actualLabel?: string
  actualLabelDenorm?: string
  showError?: boolean
  lossRatio?: number
  compact?: boolean
}

function trimLabel(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  return `${value.slice(0, Math.max(1, maxChars - 1))}…`
}

export default function StageThreeNodeLinkScene({
  values,
  contributions,
  forwardIndex,
  backwardIndex,
  predictionLabel,
  predictionLabelDenorm,
  actualLabel,
  actualLabelDenorm,
  showError = false,
  lossRatio,
  compact = false,
}: StageThreeNodeLinkSceneProps) {
  const width = compact ? 840 : 1000
  const height = compact ? 218 : 250
  const centerY = compact ? 88 : 112
  const leftPad = compact ? 44 : 52
  const rightPad = compact ? 44 : 52
  const inputCount = values.length

  const safeContributions = useMemo(() => {
    if (!values.length) return []
    if (!contributions || contributions.length !== values.length) {
      return values.map((_, idx) => (idx + 1) / values.length)
    }
    return contributions
  }, [contributions, values])

  const { points, outputPoint, nodeRadius, nodeFontSize, valueCharLimit, labelFontSize } = useMemo(() => {
    if (!inputCount) {
      return {
        points: [] as Array<{ x: number; y: number }>,
        outputPoint: { x: width - rightPad, y: centerY },
        nodeRadius: 24,
        nodeFontSize: 12,
        valueCharLimit: 4,
        labelFontSize: 11,
      }
    }

    const slots = inputCount + 1 // Includes the predicted output node
    const span = width - leftPad - rightPad
    const step = slots === 1 ? 0 : span / Math.max(1, slots - 1)

    const radiusFromStep = step * 0.27
    const baseRadius = clamp(radiusFromStep, 10, 32)
    const adaptiveRadius = clamp(baseRadius * (compact ? 0.82 : 1), 8.5, 32)
    const adaptiveFont = clamp(adaptiveRadius * 0.56, 8, 13)

    const computedPoints = values.map((_, idx) => ({
      x: leftPad + idx * step,
      y: centerY,
    }))

    return {
      points: computedPoints,
      outputPoint: { x: leftPad + (slots - 1) * step, y: centerY },
      nodeRadius: adaptiveRadius,
      nodeFontSize: adaptiveFont,
      valueCharLimit: Math.max(2, Math.floor(adaptiveRadius / 5) + 2),
      labelFontSize: clamp(adaptiveFont - 1.4, 7, 11),
    }
  }, [compact, inputCount, values])

  return (
    <div className={`scene-shell stage3-scene-shell ${compact ? 'is-compact' : ''}`}>
      <div className="scene-graph stage3-scene-graph">
        <svg className="scene-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
          {points.length > 0 && (
            <line
              x1={points[0].x}
              y1={centerY}
              x2={outputPoint.x}
              y2={centerY}
              className="edge"
              style={{ strokeWidth: 2.1 }}
            />
          )}

          {points.map((point, idx) => {
            if (idx === points.length - 1) return null
            const next = points[idx + 1]
            const forwardActive = idx < forwardIndex
            const backwardActive = backwardIndex !== null && backwardIndex !== undefined && idx >= backwardIndex
            const strength = 1.6 + (safeContributions[idx] + safeContributions[idx + 1]) * 2.1

            return (
              <g key={`stage3-link-${idx}`}>
                {forwardActive && (
                  <line
                    x1={point.x}
                    y1={centerY}
                    x2={next.x}
                    y2={centerY}
                    className="edge forward"
                    style={{ strokeWidth: Math.max(2.2, strength) }}
                  />
                )}
                {backwardActive && (
                  <line
                    x1={point.x}
                    y1={centerY}
                    x2={next.x}
                    y2={centerY}
                    className="edge backward"
                    style={{ strokeWidth: Math.max(2.2, strength) }}
                  />
                )}
              </g>
            )
          })}

          {points.length > 0 && (
            <>
              {forwardIndex >= values.length && (
                <line
                  x1={points[points.length - 1].x}
                  y1={centerY}
                  x2={outputPoint.x}
                  y2={centerY}
                  className="edge forward"
                  style={{ strokeWidth: 2.9 }}
                />
              )}
              {backwardIndex !== null && backwardIndex !== undefined && (
                <line
                  x1={points[points.length - 1].x}
                  y1={centerY}
                  x2={outputPoint.x}
                  y2={centerY}
                  className="edge backward"
                  style={{ strokeWidth: 2.9, opacity: backwardIndex <= values.length - 1 ? 1 : 0 }}
                />
              )}
            </>
          )}

          {points.map((point, idx) => {
            const forwardActive = idx <= forwardIndex
            const backwardActive = backwardIndex !== null && backwardIndex !== undefined && idx >= backwardIndex
            const passActive = forwardActive || backwardActive

            return (
              <g key={`stage3-node-${idx}`}>
                <circle
                  cx={point.x}
                  cy={centerY}
                  r={nodeRadius}
                  className={`node ${forwardActive ? 'active-forward' : ''} ${backwardActive ? 'active-backward' : ''}`}
                  style={{
                    fill: '#182434',
                    stroke: passActive ? '#f5c542' : 'rgba(145, 170, 199, 0.28)',
                    strokeWidth: passActive ? Math.max(2.2, nodeRadius * 0.14) : 2,
                    filter: passActive ? 'drop-shadow(0 0 8px rgba(245, 197, 66, 0.95)) drop-shadow(0 0 16px rgba(245, 197, 66, 0.5))' : undefined,
                    transition: 'stroke 220ms ease, stroke-width 220ms ease, filter 220ms ease',
                  }}
                />
                <text
                  x={point.x}
                  y={centerY + nodeFontSize * 0.34}
                  textAnchor="middle"
                  fill="#eef6ff"
                  fontSize={nodeFontSize}
                  fontWeight={700}
                >
                  {trimLabel(values[idx], valueCharLimit)}
                </text>
                <text
                  x={point.x}
                  y={centerY + nodeRadius + 16}
                  textAnchor="middle"
                  fill="#9fb2cb"
                  fontSize={labelFontSize}
                  fontWeight={600}
                >
                  {`x${idx + 1}`}
                </text>
              </g>
            )
          })}

          {points.length > 0 && (
            <>
              {(() => {
                const outputActive = showError || forwardIndex >= values.length || (backwardIndex !== null && backwardIndex !== undefined)
                return (
              <circle
                cx={outputPoint.x}
                cy={centerY}
                r={nodeRadius}
                className={`node ${showError ? 'active-backward' : forwardIndex >= values.length ? 'active-forward' : ''}`}
                  style={{
                    fill: '#182434',
                    stroke: outputActive ? '#f5c542' : 'rgba(145, 170, 199, 0.28)',
                    strokeWidth: outputActive ? Math.max(2.2, nodeRadius * 0.14) : 2,
                    filter: outputActive ? 'drop-shadow(0 0 8px rgba(245, 197, 66, 0.95)) drop-shadow(0 0 16px rgba(245, 197, 66, 0.5))' : undefined,
                    transition: 'stroke 220ms ease, stroke-width 220ms ease, filter 220ms ease',
                  }}
              />
                )
              })()}
              <text
                x={outputPoint.x}
                y={centerY - 4}
                textAnchor="middle"
                fill="#eaf4ff"
                fontSize={clamp(nodeFontSize - 1.1, 8, 12)}
                fontWeight={700}
              >
                y_hat
              </text>
              {predictionLabel && (
                <text
                  x={outputPoint.x}
                  y={centerY + clamp(nodeFontSize + 2, 10, 13)}
                  textAnchor="middle"
                  fill="#f5c542"
                  fontSize={clamp(nodeFontSize - 1, 8, 11)}
                  fontWeight={700}
                >
                  {trimLabel(predictionLabel, Math.max(3, valueCharLimit + 2))}
                </text>
              )}
            </>
          )}
        </svg>
      </div>

      {(predictionLabel || actualLabel) && (
        <div className="scene-output">
          {predictionLabel && (
            <div className="pill ok">
              Prediction: {predictionLabel}
              {predictionLabelDenorm && <div style={{ fontSize: '0.85em', opacity: 0.85, marginTop: 2 }}>({predictionLabelDenorm})</div>}
            </div>
          )}
          {actualLabel && (
            <div className="pill">
              Actual: {actualLabel}
              {actualLabelDenorm && <div style={{ fontSize: '0.85em', opacity: 0.85, marginTop: 2 }}>({actualLabelDenorm})</div>}
            </div>
          )}
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
