import type { ReactNode } from 'react'

export type SequenceKind = 'numeric' | 'text'

export interface ParsedSequence {
  rawInput: string
  tokens: string[]
  numbers: number[]
  kind: SequenceKind
  valid: boolean
  reason?: string
}

export interface NodeDatum {
  id: string
  label: string
  value: string
  contribution: number
  forwardActive: boolean
  backwardActive: boolean
  backwardStrength: number
}

export interface RunState {
  forwardIndex: number
  backwardIndex: number | null
  predictionVisible: boolean
  showLoss: boolean
  epoch: number
}

export interface StageCardProps {
  title: string
  intro: string
  children: ReactNode
}

export interface SimulationMetrics {
  prediction: number
  target: number
  loss: number
  weight: number
  gradient: number
}
