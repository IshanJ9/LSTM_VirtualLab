import type { ParsedSequence } from './types'

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function parseSequence(input: string): ParsedSequence {
  const normalized = input.trim()
  if (!normalized) {
    return {
      rawInput: input,
      tokens: [],
      numbers: [],
      kind: 'text',
      valid: false,
      reason: 'Please enter a sequence first.',
    }
  }

  const splitTokens = normalized
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  if (!splitTokens.length) {
    return {
      rawInput: input,
      tokens: [],
      numbers: [],
      kind: 'text',
      valid: false,
      reason: 'Could not detect any sequence elements.',
    }
  }

  const numericValues = splitTokens.map((token) => Number(token))
  const isNumeric = numericValues.every((value) => Number.isFinite(value))

  if (isNumeric) {
    return {
      rawInput: input,
      tokens: splitTokens,
      numbers: numericValues,
      kind: 'numeric',
      valid: true,
    }
  }

  return {
    rawInput: input,
    tokens: splitTokens,
    numbers: splitTokens.map((token, idx) => token.length + idx * 0.15),
    kind: 'text',
    valid: true,
  }
}

export function normalizedContributions(length: number, decay = 0.72): number[] {
  if (length <= 0) return []

  const raw = Array.from({ length }, (_, idx) => Math.pow(decay, length - idx - 1))
  const max = Math.max(...raw)
  return raw.map((value) => value / max)
}

function isFibonacciLike(numbers: number[]): boolean {
  if (numbers.length < 5) return false
  if (numbers.some((value) => value < 0)) return false
  if (Math.abs(numbers[0]) + Math.abs(numbers[1]) === 0) return false

  let maxRelativeError = 0
  let totalRelativeError = 0
  let checks = 0

  for (let i = 2; i < numbers.length; i += 1) {
    const expected = numbers[i - 1] + numbers[i - 2]
    const denominator = Math.max(1e-9, Math.abs(expected))
    const relativeError = Math.abs(numbers[i] - expected) / denominator
    maxRelativeError = Math.max(maxRelativeError, relativeError)
    totalRelativeError += relativeError
    checks += 1
  }

  const meanRelativeError = checks > 0 ? totalRelativeError / checks : Number.POSITIVE_INFINITY
  return maxRelativeError <= 0.08 && meanRelativeError <= 0.04
}

export function estimateNext(numbers: number[]): number {
  if (!numbers.length) return 0
  if (numbers.length === 1) return numbers[0]
  if (isFibonacciLike(numbers)) {
    return numbers[numbers.length - 1] + numbers[numbers.length - 2]
  }

  const diffs: number[] = []
  for (let i = 1; i < numbers.length; i += 1) {
    diffs.push(numbers[i] - numbers[i - 1])
  }

  const avgDiff = diffs.reduce((sum, value) => sum + value, 0) / diffs.length
  return numbers[numbers.length - 1] + avgDiff
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}
