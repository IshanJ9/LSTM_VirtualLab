import { useMemo, useRef, useState } from 'react'
import StageThreeNodeLinkScene from '../components/StageThreeNodeLinkScene'
import StageCard from '../components/StageCard'
import { estimateNext, normalizedContributions, parseSequence, round2, wait } from '../utils'
import type { ParsedSequence } from '../types'

type Phase = 'idle' | 'forward' | 'prediction' | 'error' | 'backward' | 'done'

interface StageTwoInteractiveProps {
  onNext?: () => void
}

export default function StageTwoInteractive({ onNext }: StageTwoInteractiveProps) {
  const [sequenceInput, setSequenceInput] = useState('10 12 15')
  const [actualValue, setActualValue] = useState('20')
  const [phase, setPhase] = useState<Phase>('idle')
  const [forwardIndex, setForwardIndex] = useState(-1)
  const [backwardIndex, setBackwardIndex] = useState<number | null>(null)
  const [predictionLabel, setPredictionLabel] = useState('')
  const [actualLabel, setActualLabel] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [errorNote, setErrorNote] = useState('')
  const [isMismatch, setIsMismatch] = useState<boolean | null>(null)
  const runToken = useRef(0)

  const parsed = useMemo<ParsedSequence>(() => {
    const base = parseSequence(sequenceInput)
    if (!base.valid) return base
    const numericValues = base.tokens.map((token) => Number(token))
    const allNumeric = numericValues.every((value) => Number.isFinite(value))

    if (!allNumeric) {
      return {
        rawInput: sequenceInput,
        tokens: base.tokens,
        numbers: [],
        kind: 'numeric',
        valid: false,
        reason: 'Please enter only numbers (space or comma separated).',
      }
    }

    return {
      ...base,
      kind: 'numeric',
      numbers: numericValues,
    }
  }, [sequenceInput])
  const contributions = useMemo(() => normalizedContributions(parsed.tokens.length, 0.7), [parsed.tokens.length])

  async function runSimulation() {
    if (!parsed.valid) return

    runToken.current += 1
    const localToken = runToken.current
    setIsRunning(true)
    setPhase('forward')
    setForwardIndex(-1)
    setBackwardIndex(null)
    setPredictionLabel('')
    setActualLabel('')
    setErrorNote('')
    setIsMismatch(null)

    const pace = 1.5 / speed

    for (let i = 0; i < parsed.tokens.length; i += 1) {
      if (localToken !== runToken.current) return
      setForwardIndex(i)
      await wait(640 * pace)
    }

    if (localToken !== runToken.current) return
    let predicted: string
    let mismatch = true
    let note = ''

    const predictedValue = round2(estimateNext(parsed.numbers))
    predicted = String(predictedValue)

    const parsedActual = Number(actualValue)
    const actualNumber = Number.isFinite(parsedActual) ? parsedActual : round2(predictedValue + 1.2)
    const actualRounded = round2(actualNumber)
    const numericGap = Math.abs(predictedValue - actualRounded)
    mismatch = numericGap > 0.01
    note = mismatch
      ? `Numeric error magnitude: ${round2(numericGap)}`
      : 'Prediction matches actual value. Error is effectively zero.'
    setActualLabel(String(actualRounded))

    setPredictionLabel(predicted)
    setErrorNote(note)
    setIsMismatch(mismatch)
    // Mark output node as reached so the predicted node is clearly visible/highlighted.
    setForwardIndex(parsed.tokens.length)
    setPhase('prediction')
    await wait(1500 * pace)

    if (localToken !== runToken.current) return
    setPhase('error')
    await wait(1700 * pace)

    if (localToken !== runToken.current) return
    setPhase('backward')
    for (let i = parsed.tokens.length - 1; i >= 0; i -= 1) {
      if (localToken !== runToken.current) return
      setBackwardIndex(i)
      await wait(560 * pace)
    }

    if (localToken !== runToken.current) return
    setPhase('done')
    setIsRunning(false)
  }

  const mismatch = isMismatch === true
  const inlineText =
    phase === 'forward'
      ? 'Forward pass: information flows left to right through the sequence.'
      : phase === 'prediction'
        ? 'Prediction node now shows what the model predicts next.'
        : phase === 'error'
          ? 'Error is computed by comparing the predicted value with the actual value.'
          : phase === 'backward'
            ? 'Backward pass: the error now travels in reverse so earlier steps can be corrected.'
            : phase === 'done'
              ? 'Recent steps influence the prediction more. Earlier steps still contribute, but less.'
              : 'Numeric mode detected. We will predict the next number and compare with your actual value.'

  return (
    <StageCard
      title="Stage 2: Interactive Example"
      intro="Now let’s explore this with a simple example. You can use your own sequence or try a default one."
      className="stage-card-full"
    >
      <div className="controls" style={{ alignItems: 'flex-end' }}>
        <div style={{ display: 'grid', gap: 6, flex: '1 1 540px' }}>
          <label htmlFor="stage2-sequence" style={{ color: '#cfe0f7', fontSize: 13 }}>Input Sequence</label>
          <input
            id="stage2-sequence"
            value={sequenceInput}
            onChange={(event) => setSequenceInput(event.target.value)}
            placeholder="Example: 10 12 15"
            aria-label="Input sequence"
            type="text"
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="stage2-actual" style={{ color: '#cfe0f7', fontSize: 13 }}>Actual Value</label>
          <input
            id="stage2-actual"
            value={actualValue}
            onChange={(event) => setActualValue(event.target.value)}
            placeholder="Example: 20"
            aria-label="Actual value"
            type="number"
          />
        </div>

        <div className="slider-wrap">
          <label htmlFor="stage2-speed">Speed</label>
          <input
            id="stage2-speed"
            type="range"
            min={0.4}
            max={2}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
          <span>{speed.toFixed(1)}x</span>
        </div>
        <button type="button" onClick={runSimulation} disabled={isRunning || !parsed.valid}>
          {isRunning ? 'Running...' : 'Run Interactive Simulation'}
        </button>
      </div>

      {!parsed.valid && <div className="inline-guide">{parsed.reason}</div>}

      {parsed.valid && (
        <>
          <StageThreeNodeLinkScene
            values={parsed.tokens}
            contributions={contributions}
            forwardIndex={forwardIndex}
            backwardIndex={phase === 'backward' || phase === 'done' ? backwardIndex : null}
              compact
            predictionLabel={predictionLabel || undefined}
            actualLabel={actualLabel || undefined}
            showError={mismatch && (phase === 'error' || phase === 'backward' || phase === 'done')}
          />

          <div className="inline-guide">{inlineText}</div>

          {errorNote && phase !== 'idle' && (
            <div className="inline-guide" style={{ marginTop: 8 }}>{errorNote}</div>
          )}

          <div className="explain-block">
            The model sends the error backward through all steps. It evaluates how much each step contributed, then adjusts itself based on this contribution signal.
          </div>

          {phase === 'done' && (
            <div className="controls" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button type="button" onClick={onNext}>Next</button>
            </div>
          )}
        </>
      )}
    </StageCard>
  )
}
