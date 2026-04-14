import { useState } from 'react'
import '../bptt/BpttLab.css'
import StageOneIntro from '../bptt/stages/StageOneIntro'
import StageTwoInteractive from '../bptt/stages/StageTwoInteractive'
import StageThreeFull from '../bptt/stages/StageThreeFull'

type Stage = 1 | 2 | 3

export default function BPTTLab() {
  const [activeStage, setActiveStage] = useState<Stage>(1)

  return (
    <div className="bptt-shell">
      <header className="bptt-header">
        <h1>BPTT Virtual Lab</h1>
        <p>
          A guided visual learning experience for Backpropagation Through Time.
          Focus on flow: forward information, error formation, backward correction, and learning updates.
        </p>
      </header>

      <div className="stage-tabs" role="tablist" aria-label="BPTT learning stages">
        <button className={`stage-tab ${activeStage === 1 ? 'is-active' : ''}`} type="button" onClick={() => setActiveStage(1)}>
          Stage 1: Problem
        </button>
        <button className={`stage-tab ${activeStage === 2 ? 'is-active' : ''}`} type="button" onClick={() => setActiveStage(2)}>
          Stage 2: Interactive Example
        </button>
        <button className={`stage-tab ${activeStage === 3 ? 'is-active' : ''}`} type="button" onClick={() => setActiveStage(3)}>
          Stage 3: Full Simulation
        </button>
      </div>

      {activeStage === 1 && <StageOneIntro onNext={() => setActiveStage(2)} />}
      {activeStage === 2 && <StageTwoInteractive onNext={() => setActiveStage(3)} />}
      {activeStage === 3 && <StageThreeFull />}
    </div>
  )
}
