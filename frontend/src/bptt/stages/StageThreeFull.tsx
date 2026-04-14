import { useMemo, useRef, useState } from 'react'
import NodeLinkScene from '../components/NodeLinkScene'
import StageCard from '../components/StageCard'
import { clamp, estimateNext, normalizedContributions, parseSequence, round2, wait } from '../utils'

type Phase = 'idle' | 'forward' | 'prediction' | 'loss' | 'backward' | 'update' | 'done'

export default function StageThreeFull() {
  const [sequenceInput, setSequenceInput] = useState('10 12 15 18 21 25 30')
  const [seqLength, setSeqLength] = useState(12)
  const [learningRate, setLearningRate] = useState(0.07)
  const [decay, setDecay] = useState(0.72)
  const [noiseFactor, setNoiseFactor] = useState(0.04)
  const [speed, setSpeed] = useState(1)
  const [technicalMode, setTechnicalMode] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [forwardIndex, setForwardIndex] = useState(-1)
  const [backwardIndex, setBackwardIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [epoch, setEpoch] = useState(0)
  const [weight, setWeight] = useState(0.72)
  const [prediction, setPrediction] = useState(0)
  const [target, setTarget] = useState(0)
  const [loss, setLoss] = useState(0)
  const [gradient, setGradient] = useState(0)

  const runToken = useRef(0)

  const parsedRaw = useMemo(() => parseSequence(sequenceInput), [sequenceInput])

  const numbers = useMemo(() => {
    const generated = parsedRaw.numbers.length
      ? parsedRaw.numbers
      : Array.from({ length: Math.max(5, seqLength) }, (_, idx) => idx + 1)

    const selected = generated.slice(0, seqLength)
    if (selected.length >= 2) return selected
    return [1, 2, 3, 4, 5]
  }, [parsedRaw.numbers, seqLength])

  const labels = useMemo(() => {
    const base = parsedRaw.kind === 'numeric'
      ? numbers.map((value) => String(round2(value)))
      : parsedRaw.tokens.length
        ? parsedRaw.tokens.slice(0, seqLength)
        : numbers.map((_, idx) => `x${idx + 1}`)

    return base.length >= 2 ? base : ['x1', 'x2', 'x3', 'x4', 'x5']
  }, [numbers, parsedRaw.kind, parsedRaw.tokens, seqLength])

  const contributions = useMemo(() => normalizedContributions(labels.length, decay), [labels.length, decay])
  const pauseMs = useMemo(() => clamp(920 / speed, 100, 1400), [speed])
  const timelineWidth = useMemo(() => Math.max(1000, labels.length * 110), [labels.length])

  function featuresFromNumbers(series: number[]): number {
    return series.reduce((sum, value, idx) => sum + value * Math.pow(decay, series.length - idx - 1), 0)
  }

  function resetViewOnly() {
    setForwardIndex(-1)
    setBackwardIndex(null)
    setPhase('idle')
  }

  function resetAll() {
    runToken.current += 1
    resetViewOnly()
    setIsPlaying(false)
    setEpoch(0)
    setWeight(0.72)
    setPrediction(0)
    setTarget(0)
    setLoss(0)
    setGradient(0)
  }

  async function runSingleEpoch(localToken: number, localWeight: number, epochNumber: number): Promise<number> {
    setEpoch(epochNumber)
    setPhase('forward')
    setForwardIndex(-1)
    setBackwardIndex(null)

    for (let i = 0; i < labels.length; i += 1) {
      if (localToken !== runToken.current) return localWeight
      setForwardIndex(i)
      await wait(pauseMs)
    }

    const featureSignal = featuresFromNumbers(numbers)
    const targetValue = estimateNext(numbers)
    const noise = (Math.random() - 0.5) * noiseFactor * Math.max(1, Math.abs(targetValue))
    const predValue = localWeight * featureSignal + noise

    if (localToken !== runToken.current) return localWeight
    setPhase('prediction')
    setForwardIndex(labels.length)
    setPrediction(round2(predValue))
    setTarget(round2(targetValue))
    await wait(pauseMs)

    const computedLoss = Math.pow(targetValue - predValue, 2)
    if (localToken !== runToken.current) return localWeight
    setPhase('loss')
    setLoss(round2(computedLoss))
    await wait(pauseMs)

    if (localToken !== runToken.current) return localWeight
    setPhase('backward')
    for (let i = labels.length - 1; i >= 0; i -= 1) {
      if (localToken !== runToken.current) return localWeight
      setBackwardIndex(i)
      await wait(pauseMs * 0.75)
    }

    const grad = -2 * (targetValue - predValue) * featureSignal
    if (localToken !== runToken.current) return localWeight
    setGradient(round2(grad))
    setPhase('update')

    const updatedWeight = localWeight - learningRate * grad
    setWeight(round2(updatedWeight))
    await wait(pauseMs)

    return updatedWeight
  }

  async function playEpochs(epochCount = 3) {
    if (!parsedRaw.valid || labels.length < 2) return

    runToken.current += 1
    const localToken = runToken.current
    setIsPlaying(true)

    let localWeight = weight
    for (let i = 1; i <= epochCount; i += 1) {
      localWeight = await runSingleEpoch(localToken, localWeight, i)
      if (localToken !== runToken.current) return
    }

    if (localToken !== runToken.current) return
    setPhase('done')
    setIsPlaying(false)
  }

  function pausePlayback() {
    runToken.current += 1
    setIsPlaying(false)
  }

  async function stepForward() {
    if (isPlaying) return
    const next = clamp(forwardIndex + 1, 0, labels.length)
    setPhase('forward')
    setForwardIndex(next)
    if (next === labels.length) {
      setPhase('prediction')
      const targetValue = estimateNext(numbers)
      setPrediction(round2(weight * featuresFromNumbers(numbers)))
      setTarget(round2(targetValue))
    }
  }

  function stepBackward() {
    if (isPlaying) return
    setPhase('backward')
    if (backwardIndex === null) {
      setBackwardIndex(labels.length - 1)
      return
    }
    setBackwardIndex((prev) => {
      if (prev === null) return labels.length - 1
      return Math.max(0, prev - 1)
    })
  }

  const simpleExplanation =
    phase === 'forward'
      ? 'The model processes input steps one-by-one from left to right.'
      : phase === 'prediction'
        ? 'The final hidden signal produces the prediction at y_hat.'
        : phase === 'loss'
          ? 'The model measures prediction error with L = (y - y_hat)^2.'
          : phase === 'backward'
            ? 'Error flows backward across time, assigning contribution to each step.'
            : phase === 'update'
              ? 'The model updates its weight using the gradient and learning rate.'
              : phase === 'done'
                ? 'After updates, prediction moves closer to target.'
                : 'Press Play to run the complete BPTT cycle.'

  return (
    <StageCard
      title="Stage 3: Full BPTT Simulation"
      intro="Now let’s explore the complete working of BPTT."
      className="stage-card-full"
    >
      <div className="stage3-grid">
        <aside className="stage3-panel stage3-controls">
          <div className="stage3-title">Controls</div>

          <label htmlFor="stage3-sequence" className="stage3-label">Input Sequence</label>
          <textarea
            className="stage3-textarea"
            id="stage3-sequence"
            value={sequenceInput}
            onChange={(event) => setSequenceInput(event.target.value)}
            aria-label="Sequence input"
            placeholder="Enter numeric or text sequence"
          />

          <div className="stage3-slider-row">
            <label htmlFor="seq-length">Sequence length</label>
            <span>{seqLength}</span>
          </div>
          <input
            className="stage3-range"
            id="seq-length"
            type="range"
            min={5}
            max={60}
            value={seqLength}
            onChange={(event) => setSeqLength(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="learning-rate">Learning rate</label>
            <span>{learningRate.toFixed(2)}</span>
          </div>
          <input
            className="stage3-range"
            id="learning-rate"
            type="range"
            min={0.01}
            max={0.25}
            step={0.01}
            value={learningRate}
            onChange={(event) => setLearningRate(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="decay-factor">Gradient decay</label>
            <span>{decay.toFixed(2)}</span>
          </div>
          <input
            className="stage3-range"
            id="decay-factor"
            type="range"
            min={0.4}
            max={0.95}
            step={0.01}
            value={decay}
            onChange={(event) => setDecay(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="noise-factor">Noise/Error factor</label>
            <span>{noiseFactor.toFixed(2)}</span>
          </div>
          <input
            className="stage3-range"
            id="noise-factor"
            type="range"
            min={0}
            max={0.2}
            step={0.01}
            value={noiseFactor}
            onChange={(event) => setNoiseFactor(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="speed">Speed</label>
            <span>{speed.toFixed(1)}x</span>
          </div>
          <input
            className="stage3-range"
            id="speed"
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />

          <div className="stage3-actions">
            {!isPlaying ? (
              <button className="stage3-btn stage3-btn-primary" type="button" onClick={() => playEpochs(4)}>Play</button>
            ) : (
              <button className="stage3-btn stage3-btn-primary" type="button" onClick={pausePlayback}>Pause</button>
            )}
            <button className="stage3-btn" type="button" onClick={stepForward} disabled={isPlaying}>Step +</button>
            <button className="stage3-btn" type="button" onClick={stepBackward} disabled={isPlaying}>Step -</button>
            <button className="stage3-btn" type="button" onClick={resetViewOnly} disabled={isPlaying}>Reset View</button>
            <button className="stage3-btn stage3-btn-danger" type="button" onClick={resetAll}>Reset All</button>
          </div>

          <button className="stage3-btn stage3-btn-wide" type="button" onClick={() => setTechnicalMode((value) => !value)}>
            {technicalMode ? 'Simple Explanation' : 'Technical Explanation'}
          </button>
        </aside>

        <section className="stage3-panel stage3-main">
          <div className="stage3-title" style={{ marginBottom: 8 }}>
            Main Simulation (Forward, Loss, Backward, Update)
          </div>

          <div className="stage3-scroller">
            <div style={{ minWidth: timelineWidth }}>
              <NodeLinkScene
                values={labels}
                contributions={contributions}
                forwardIndex={forwardIndex}
                backwardIndex={phase === 'backward' || phase === 'update' || phase === 'done' ? backwardIndex : null}
                curvedEdges
                showDualCurves
                showOutput
                outputNodeLabel="y_hat"
                predictionLabel={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(prediction) : undefined}
                actualLabel={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(target) : undefined}
                showError={phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done'}
                lossRatio={target !== 0 ? clamp(loss / (Math.abs(target) + 1), 0, 1) : clamp(loss, 0, 1)}
                timelineWidth={timelineWidth}
              />
            </div>
          </div>

          <div className="metrics">
            <div className="metric">Phase: {phase}</div>
            <div className="metric">Epoch: {epoch}</div>
            <div className="metric">W: {weight}</div>
            <div className="metric">y_hat: {prediction}</div>
            <div className="metric">y: {target}</div>
            <div className="metric">L: {loss}</div>
            <div className="metric">gradient: {gradient}</div>
          </div>
        </section>
      </div>

      <section className="stage3-panel stage3-explain">
        <div className="stage3-title" style={{ marginBottom: 8 }}>
          Explanation Panel
        </div>

        {!technicalMode && (
          <div className="inline-guide">
            {simpleExplanation}
            <div style={{ marginTop: 8 }}>
              The model processes inputs step-by-step, makes a prediction, measures error, sends error backward through time, and updates itself.
            </div>
          </div>
        )}

        {technicalMode && (
          <div className="inline-guide stage3-technical">
            <div>Forward: h_t = f(x_t, h_(t-1))</div>
            <div>Loss: L = (y - y_hat)^2</div>
            <div>Backward: dL/dh_t</div>
            <div>Gradient accumulation: dL/dW = sum over time</div>
            <div>Update: W = W - lr * gradient</div>
          </div>
        )}
      </section>
    </StageCard>
  )
}
