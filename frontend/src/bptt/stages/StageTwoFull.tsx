import { useEffect, useMemo, useRef, useState } from 'react'
import StageTwoNodeLinkScene from '../components/StageTwoNodeLinkScene'
import StageCard from '../components/StageCard'
import { clamp, estimateNext, normalizedContributions, parseSequence, round2, wait } from '../utils'
import katex from 'katex'
import 'katex/dist/katex.css'

type Phase = 'idle' | 'forward' | 'prediction' | 'loss' | 'backward' | 'update' | 'done'

interface EpochRecord {
  epoch: number
  prediction: number
  predictionDenorm: number
  target: number;
  targetDenorm: number
  loss: number
  gradient: number
  weight: number
  bpttWindow: number
}

function BlockMath({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true })
  return <div className="stage3-tech-equation" dangerouslySetInnerHTML={{ __html: html }} />
}

export default function StageTwoFull() {
  const [sequenceInput, setSequenceInput] = useState('1 1 2 3 5 8 13 21')
  const [selectedEpochs, setSelectedEpochs] = useState(20)
  const [learningRate, setLearningRate] = useState(0.012)
  const [decay, setDecay] = useState(0.9)
  const [noiseFactor, setNoiseFactor] = useState(0.05)
  const [bpttWindow, setBpttWindow] = useState<number | null>(null)
  const [speed, setSpeed] = useState(1)
  const [technicalMode, setTechnicalMode] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [forwardIndex, setForwardIndex] = useState(-1)
  const [backwardIndex, setBackwardIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [epoch, setEpoch] = useState(0)
  const [weight, setWeight] = useState(0.72)
  const [prediction, setPrediction] = useState(0)
  const [predictionDenorm, setPredictionDenorm] = useState(0)
  const [target, setTarget] = useState(0)
  const [targetDenorm, setTargetDenorm] = useState(0)
  const [loss, setLoss] = useState(0)
  const [gradient, setGradient] = useState(0)
  const [epochRecords, setEpochRecords] = useState<EpochRecord[]>([])

  const runToken = useRef(0)

  const parsedRaw = useMemo(() => parseSequence(sequenceInput), [sequenceInput])

  const numbers = useMemo(() => {
    const generated = parsedRaw.numbers.length
      ? parsedRaw.numbers
      : Array.from({ length: Math.max(5, parsedRaw.tokens.length || 0) }, (_, idx) => idx + 1)

    if (generated.length >= 2) return generated
    return [1, 2, 3, 4, 5]
  }, [parsedRaw.numbers, parsedRaw.tokens.length])

  const labels = useMemo(() => {
    const base = parsedRaw.kind === 'numeric'
      ? numbers.map((value) => String(round2(value)))
      : parsedRaw.tokens.length
        ? parsedRaw.tokens
        : numbers.map((_, idx) => `x${idx + 1}`)

    return base.length >= 2 ? base : ['x1', 'x2', 'x3', 'x4', 'x5']
  }, [numbers, parsedRaw.kind, parsedRaw.tokens])

  const inputScale = useMemo(() => {
    const maxInput = Math.max(...numbers.map((value) => Math.abs(value)), 1)
    return maxInput > 0 ? maxInput : 1
  }, [numbers])

  const normalizedNumbers = useMemo(() => {
    return numbers.map((value) => value / inputScale)
  }, [numbers, inputScale])

  const minWindow = Math.min(5, labels.length)
  const maxWindow = labels.length
  const effectiveWindow = useMemo(() => {
    if (bpttWindow === null) return maxWindow
    return clamp(bpttWindow, minWindow, maxWindow)
  }, [bpttWindow, maxWindow, minWindow])

  useEffect(() => {
    setBpttWindow((prev) => {
      if (prev === null) return labels.length
      return clamp(prev, minWindow, labels.length)
    })
  }, [labels.length, minWindow])

  const contributions = useMemo(() => normalizedContributions(labels.length, decay), [labels.length, decay])
  const pauseMs = useMemo(() => clamp(920 / speed, 100, 1400), [speed])
  const safeLearningRate = useMemo(() => clamp(learningRate, 0.001, 0.02), [learningRate])

  function roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }

  function featuresFromNumbers(series: number[], windowSize: number): number {
    const trimmed = series.slice(Math.max(0, series.length - windowSize))
    return trimmed.reduce((sum, value, idx) => sum + value * Math.pow(decay, trimmed.length - idx - 1), 0)
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
    setBpttWindow(labels.length)
    setSelectedEpochs(20)
    setPrediction(0)
    setPredictionDenorm(0)
    setTarget(0)
    setTargetDenorm(0)
    setLoss(0)
    setGradient(0)
    setEpochRecords([])
  }

  async function runSingleEpoch(localToken: number, localWeight: number, epochNumber: number): Promise<{ nextWeight: number; nextLoss: number }> {
    setEpoch(epochNumber)
    setPhase('forward')
    setForwardIndex(-1)
    setBackwardIndex(null)

    for (let i = 0; i < labels.length; i += 1) {
      if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
      setForwardIndex(i)
      await wait(pauseMs)
    }

    const featureSignal = featuresFromNumbers(normalizedNumbers, effectiveWindow)
    const targetValue = estimateNext(numbers) / inputScale
    const noise = (Math.random() - 0.5) * noiseFactor * Math.max(1, Math.abs(targetValue))
    const predValue = localWeight * featureSignal + noise

    if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
    setPhase('prediction')
    setForwardIndex(labels.length)
    setPrediction(round2(predValue))
    setPredictionDenorm(round2(predValue * inputScale))
    setTarget(round2(targetValue))
    setTargetDenorm(round2(targetValue * inputScale))
    await wait(pauseMs)

    const computedLoss = Math.pow(targetValue - predValue, 2)
    if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
    setPhase('loss')
    setLoss(round2(computedLoss))
    await wait(pauseMs)

    if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
    setPhase('backward')
    const backwardStop = Math.max(0, labels.length - effectiveWindow)
    for (let i = labels.length - 1; i >= backwardStop; i -= 1) {
      if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
      setBackwardIndex(i)
      await wait(pauseMs * 0.75)
    }

    const rawGrad = -2 * (targetValue - predValue) * featureSignal
    const scaledGrad = rawGrad * 2.0
    const grad = clamp(scaledGrad, -20, 20)
    if (localToken !== runToken.current) return { nextWeight: localWeight, nextLoss: Number.POSITIVE_INFINITY }
    const roundedPred = round2(predValue)
    const roundedPredDenorm = round2(predValue * inputScale)
    const roundedTarget = round2(targetValue)
    const roundedTargetDenorm = round2(targetValue * inputScale)
    const roundedLoss = roundTo(computedLoss, 5)
    const roundedGrad = round2(grad)
    setGradient(roundedGrad)
    setPhase('update')

    const updatedWeight = clamp(localWeight - safeLearningRate * grad, -100, 100)
    const roundedWeight = round2(updatedWeight)
    setWeight(roundedWeight)
    setEpochRecords((prev) => [
      ...prev,
      {
        epoch: epochNumber,
        prediction: roundedPred,
        predictionDenorm: roundedPredDenorm,
        target: roundedTarget,
        targetDenorm: roundedTargetDenorm,
        loss: roundedLoss,
        gradient: roundedGrad,
        weight: roundedWeight,
        bpttWindow: effectiveWindow,
      },
    ])
    await wait(pauseMs)

    return { nextWeight: updatedWeight, nextLoss: computedLoss }
  }

  async function playEpochs(epochCount: number, appendHistory = true) {
    if (!parsedRaw.valid || labels.length < 2) return

    runToken.current += 1
    const localToken = runToken.current
    setIsPlaying(true)

    const safeEpochCount = clamp(epochCount, 5, 50)
    if (!appendHistory) {
      setEpochRecords([])
      setEpoch(0)
    }

    let localWeight = weight
    const baseEpoch = appendHistory ? epoch : 0
    for (let i = 1; i <= safeEpochCount; i += 1) {
      const result = await runSingleEpoch(localToken, localWeight, baseEpoch + i)
      localWeight = result.nextWeight
      if (localToken !== runToken.current) {
        setIsPlaying(false)
        return
      }
    }

    if (localToken !== runToken.current) {
      setIsPlaying(false)
      return
    }
    setPhase('done')
    setIsPlaying(false)
  }

  function trainMore() {
    if (isPlaying) return
    void playEpochs(selectedEpochs, true)
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
      const targetValue = estimateNext(numbers) / inputScale
      const predValue = weight * featuresFromNumbers(normalizedNumbers, effectiveWindow)
      setPrediction(round2(predValue))
      setPredictionDenorm(round2(predValue * inputScale))
      setTarget(round2(targetValue))
      setTargetDenorm(round2(targetValue * inputScale))
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

  const convergenceStatus = useMemo(() => {
    if (!epochRecords.length) return 'Not Started'
    const latestLoss = epochRecords[epochRecords.length - 1].loss
    if (latestLoss < 0.001) return 'Converged'
    if (epochRecords.length >= 4) {
      const recent = epochRecords.slice(-4).map((row) => row.loss)
      const decreasing = recent[3] < recent[2] && recent[2] < recent[1] && recent[1] < recent[0]
      if (decreasing) return 'Converging'
    }
    return 'Slow Learning'
  }, [epochRecords])

  const simpleExplanation =
    phase === 'forward'
      ? 'The model processes the sequence step-by-step and builds an internal representation.'
      : phase === 'prediction'
        ? 'The model generates a prediction based on the learned pattern.'
        : phase === 'loss'
          ? 'The prediction differs from the actual value, creating an error that must be corrected.'
          : phase === 'backward'
            ? 'The error is propagated backward through all time steps, allowing the model to identify which steps contributed to the mistake.'
            : phase === 'update'
              ? 'The model updates its weights to reduce the prediction error in future iterations.'
              : phase === 'done'
                ? 'The prediction has moved closer to the target, indicating that the model has learned from the sequence.'
                : 'Press Play to run the complete BPTT cycle.'

  return (
    <StageCard
      title="Stage 2: Full BPTT Simulation"
      intro="Now let’s explore the complete working of BPTT."
      className="stage-card-full"
    >
      <div className="stage3-grid">
        <aside className="stage3-panel stage3-controls">
          <div className="stage3-title">Controls</div>

          <label htmlFor="stage3-sequence" className="stage3-label">Input Sequence</label>
          <select
            className="stage3-select"
            style={{ width: '100%', marginBottom: 16, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            id="stage3-sequence"
            value={sequenceInput}
            onChange={(event) => setSequenceInput(event.target.value)}
            aria-label="Sequence input"
          >
            <option value="1 1 2 3 5 8 13 21">Fibonacci (1, 1, 2, 3, 5, 8, 13, 21)</option>
            <option value="5 10 15 20 25 30 35">Multiples of 5 (5, 10, 15, 20, 25, 30, 35)</option>
            <option value="1 4 9 16 25 36 49">Squares (1, 4, 9, 16, 25, 36, 49)</option>
            <option value="2 4 8 16 32 64 128">Powers of 2 (2, 4, 8, 16, 32, 64, 128)</option>
            <option value="2 0.75 0.44 0.31 0.24 0.19">Math Series 1/x + 1/x² (2, 0.75, 0.44...)</option>
          </select>

          <div className="stage3-slider-row">
            <label htmlFor="epochs">Epochs</label>
            <span>{selectedEpochs}</span>
          </div>
          <input
            className="stage3-range"
            id="epochs"
            type="range"
            min={5}
            max={50}
            step={1}
            value={selectedEpochs}
            onChange={(event) => setSelectedEpochs(clamp(Number(event.target.value), 5, 50))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="learning-rate">Learning rate</label>
            <span>{learningRate.toFixed(3)}</span>
          </div>
          <input
            className="stage3-range"
            id="learning-rate"
            type="range"
            min={0.001}
            max={0.02}
            step={0.001}
            value={learningRate}
            onChange={(event) => setLearningRate(clamp(Number(event.target.value), 0.001, 0.02))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="decay-factor">Gradient decay factor</label>
            <span>{decay.toFixed(2)}</span>
          </div>
          <input
            className="stage3-range"
            id="decay-factor"
            type="range"
            min={0.7}
            max={0.99}
            step={0.01}
            value={decay}
            onChange={(event) => setDecay(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="bptt-window">BPTT window</label>
            <span>{effectiveWindow}</span>
          </div>
          <input
            className="stage3-range"
            id="bptt-window"
            type="range"
            min={minWindow}
            max={maxWindow}
            step={1}
            value={effectiveWindow}
            onChange={(event) => setBpttWindow(Number(event.target.value))}
          />

          <div className="stage3-slider-row">
            <label htmlFor="noise-factor">Error factor</label>
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
            <label htmlFor="speed">Simulation speed</label>
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
              <button className="stage3-btn stage3-btn-primary" type="button" onClick={() => playEpochs(selectedEpochs, true)}>Play</button>
            ) : (
              <button className="stage3-btn stage3-btn-primary" type="button" onClick={pausePlayback}>Pause</button>
            )}
            <button className="stage3-btn" type="button" onClick={trainMore} disabled={isPlaying}>Train More</button>
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
            <StageTwoNodeLinkScene
              values={labels}
              contributions={contributions}
              forwardIndex={forwardIndex}
              backwardIndex={phase === 'backward' || phase === 'update' || phase === 'done' ? backwardIndex : null}
              predictionLabel={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(prediction) : undefined}
              predictionLabelDenorm={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(predictionDenorm) : undefined}
              actualLabel={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(target) : undefined}
              actualLabelDenorm={epoch > 0 || phase === 'prediction' || phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done' ? String(targetDenorm) : undefined}
              showError={phase === 'loss' || phase === 'backward' || phase === 'update' || phase === 'done'}
              lossRatio={target !== 0 ? clamp(loss / (Math.abs(target) + 1), 0, 1) : clamp(loss, 0, 1)}
            />
          </div>

          <div className="stage3-epoch-table-wrap">
            <div className="stage3-title" style={{ marginBottom: 8 }}>
              Epoch-wise Training Summary
            </div>
            {epochRecords.length === 0 ? (
              <div className="inline-guide" style={{ marginTop: 0 }}>
                Run the simulation to populate epoch-wise results.
              </div>
            ) : (
              <div className="stage3-epoch-table-scroll">
                <table className="stage3-epoch-table" aria-label="Epoch-wise training summary">
                  <thead>
                    <tr>
                      <th>Epoch</th>
                      <th>Prediction</th>
                      <th>Prediction (denorm)</th>
                      <th>Target</th>
                      <th>Target (denorm)</th>
                      <th>Loss</th>
                      <th>Gradient</th>
                      <th>Weight (W)</th>
                      <th>BPTT Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {epochRecords.map((row) => (
                      <tr key={`epoch-row-${row.epoch}`}>
                        <td>{row.epoch}</td>
                        <td>{row.prediction}</td>
                        <td>{row.predictionDenorm}</td>
                        <td>{row.target}</td>
                        <td>{row.targetDenorm}</td>
                        <td>{row.loss}</td>
                        <td>{row.gradient}</td>
                        <td>{row.weight}</td>
                        <td>{row.bpttWindow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="metrics">
            <div className="metric">Phase: {phase}</div>
            <div className="metric">Epoch: {epoch}</div>
            <div className="metric">W: {weight}</div>
            <div className="metric">y_hat: {prediction}</div>
            <div className="metric">y_hat (denorm): {predictionDenorm}</div>
            <div className="metric">y: {target}</div>
            <div className="metric">y (denorm): {targetDenorm}</div>
            <div className="metric">L: {loss.toFixed(5)}</div>
            <div className="metric">gradient: {gradient}</div>
            <div className="metric">BPTT window: {effectiveWindow}</div>
            <div className="metric">Status: {convergenceStatus}</div>
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
          <div className="inline-guide stage3-technical stage3-tech-grid">
            <section className="stage3-tech-item">
              <h4>1. Forward Pass</h4>
              <BlockMath tex={String.raw`h_t = f(W x_t + U h_{t-1})`} />
              <p>
                Where: x_t is input at time t, h_(t-1) is previous hidden state, h_t is current hidden state,
                W is input weight matrix, U is recurrent weight matrix, and f is the activation function.
              </p>
              <p>
                The model combines current input and prior state to compute the new hidden state,
                preserving sequence context across time.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>2. Output / Prediction</h4>
              <BlockMath tex={String.raw`\hat{y} = V h_T`} />
              <p>
                Where: h_T is the final hidden state, V is output weight matrix, and y_hat is prediction.
              </p>
              <p>
                The final hidden representation is projected into output space to generate prediction.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>3. Loss Function</h4>
              <BlockMath tex={String.raw`L = (y - \hat{y})^2`} />
              <p>
                Where: y is actual value, y_hat is predicted value, and L is squared error loss.
              </p>
              <p>
                This quantifies prediction error by measuring squared distance between target and prediction.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>4. Backpropagation Through Time</h4>
              <BlockMath tex={String.raw`\frac{dL}{dh_t} = \frac{dL}{dh_{t+1}} \cdot \frac{dh_{t+1}}{dh_t}`} />
              <p>
                Where: dL/dh_t is gradient at time t, dL/dh_(t+1) is incoming gradient from next step,
                and dh_(t+1)/dh_t captures temporal dependency between consecutive hidden states.
              </p>
              <p>
                Error is propagated backward through time so each step learns its contribution to final loss.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>5. Gradient Accumulation</h4>
              <BlockMath tex={String.raw`\frac{dL}{dW} = \sum_{t=1}^{T} \frac{dL}{dW_t}`} />
              <p>
                Where: dL/dW is total gradient, dL/dW_t is per-step gradient, and T is sequence length.
              </p>
              <p>
                Gradients from all time steps are accumulated to produce the full sequence-level update.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>6. Weight Update</h4>
              <BlockMath tex={String.raw`W = W - \eta \cdot \frac{dL}{dW}`} />
              <p>
                Where: W is model weights, eta is learning rate, and dL/dW is gradient.
              </p>
              <p>
                Gradient descent updates parameters in the direction that reduces the overall loss.
              </p>
            </section>

            <section className="stage3-tech-item">
              <h4>7. Gradient Clipping (Optional)</h4>
              <BlockMath tex={String.raw`g = clip(g, -c, c)`} />
              <p>
                Where: g is gradient value and c is clipping threshold.
              </p>
              <p>
                Gradients are restricted to a bounded range to prevent exploding-gradient instability.
              </p>
            </section>
          </div>
        )}
      </section>
    </StageCard>
  )
}
