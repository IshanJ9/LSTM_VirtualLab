import { useEffect, useRef, useState } from 'react'
import StageTwoNodeLinkScene from '../components/StageTwoNodeLinkScene'
import StageCard from '../components/StageCard'
import { normalizedContributions, wait } from '../utils'

type Phase = 'idle' | 'forward' | 'prediction' | 'done'

const tokens = ['10', '12', '15']
const predicted = '18'
const actual = '20'

interface StageOneIntroProps {
  onNext?: () => void
}

export default function StageOneIntro({ onNext }: StageOneIntroProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [forwardIndex, setForwardIndex] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const runToken = useRef(0)

  useEffect(() => {
    runWalkthrough()
    return () => {
      runToken.current += 1
    }
  }, [])

  async function runWalkthrough() {
    const pace = 1.6 / speed
    runToken.current += 1
    const localToken = runToken.current

    setPhase('forward')
    setForwardIndex(-1)

    for (let i = 0; i < tokens.length; i += 1) {
      if (localToken !== runToken.current) return
      setForwardIndex(i)
      await wait(560 * pace)
    }

    if (localToken !== runToken.current) return
    setPhase('prediction')
    await wait(1500 * pace)

    if (localToken !== runToken.current) return
    setPhase('done')
  }

  const contributions = normalizedContributions(tokens.length, 0.68)

  return (
    <StageCard
      title="Stage 1: Problem Understanding"
      intro="Let’s first understand the problem. When a model works with sequences, its prediction depends on multiple previous steps. But what happens when it makes a mistake?"
      className="stage-card-full"
    >
      <div className="controls">
        <button type="button" onClick={runWalkthrough}>Replay Walkthrough</button>
        <div className="slider-wrap">
          <label htmlFor="stage1-speed">Speed</label>
          <input
            id="stage1-speed"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
          <span>{speed.toFixed(1)}x</span>
        </div>
      </div>

      <StageTwoNodeLinkScene
        values={tokens}
        contributions={contributions}
        forwardIndex={forwardIndex}
        backwardIndex={null}
          compact
        predictionLabel={phase === 'prediction' || phase === 'done' ? predicted : undefined}
        actualLabel={phase === 'prediction' || phase === 'done' ? actual : undefined}
        showError={false}
      />

      <div className="inline-guide">
        {phase === 'forward' && 'Forward pass: information flows left to right through each step in the sequence.'}
        {phase === 'prediction' && 'Prediction appears at the output node.'}
        {phase === 'done' && 'So how does the model learn from this?'}
        {phase === 'idle' && 'Press replay to start the mini simulation.'}
      </div>

      <div className="explain-block">
        Backpropagation Through Time sends error backward from the output to earlier sequence steps, so each step can be corrected based on its role in the final prediction. Let’s understand it better in the next stage.
      </div>

      {phase === 'done' && (
        <div className="controls" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button type="button" onClick={onNext}>Next</button>
        </div>
      )}
    </StageCard>
  )
}
