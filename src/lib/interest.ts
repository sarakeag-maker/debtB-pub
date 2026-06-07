import { differenceInDays } from 'date-fns'
import { InstructionStage } from '@prisma/client'
import { InterestResult } from '@/types'

// Statutory rate under s.69 County Courts Act 1984
export const STATUTORY_RATE = 0.08

// Ordered array of all instruction stages
export const STAGE_ORDER: InstructionStage[] = [
  InstructionStage.DEMAND_LETTER,
  InstructionStage.LETTER_BEFORE_ACTION,
  InstructionStage.CHASER,
  InstructionStage.DRAFT_CLAIM,
  InstructionStage.CLAIM_ISSUED,
  InstructionStage.ENFORCEMENT,
  InstructionStage.RESOLVED,
]

/**
 * Returns the next stage in the pipeline, or null if already at the last stage.
 */
export function getNextStage(current: InstructionStage): InstructionStage | null {
  const idx = STAGE_ORDER.indexOf(current)
  if (idx === -1 || idx === STAGE_ORDER.length - 1) {
    return null
  }
  return STAGE_ORDER[idx + 1]
}

/**
 * Converts an InstructionStage enum value to a human-readable label.
 */
export function formatStageLabel(stage: InstructionStage | string): string {
  const labels: Record<string, string> = {
    DEMAND_LETTER: 'Demand Letter',
    LETTER_BEFORE_ACTION: 'Letter Before Action',
    CHASER: 'Chaser',
    DRAFT_CLAIM: 'Draft Claim',
    CLAIM_ISSUED: 'Claim Issued',
    ENFORCEMENT: 'Enforcement',
    RESOLVED: 'Resolved',
  }
  return labels[stage] ?? stage
}

export interface CalculateInterestParams {
  principalAmount: number
  dueFromDate: Date | string
  interestType: 'STATUTORY' | 'CONTRACTUAL'
  contractualRate?: number | null
  asOf?: Date
}

/**
 * Calculates simple interest accrued on a debt.
 *
 * Formula: interest = principal × rate × (days / 365)
 * - Statutory rate: 8% per annum (s.69 County Courts Act 1984)
 * - Contractual rate: as specified in the lease/agreement
 */
export function calculateInterest(params: CalculateInterestParams): InterestResult {
  const {
    principalAmount,
    dueFromDate,
    interestType,
    contractualRate,
    asOf = new Date(),
  } = params

  const fromDate =
    typeof dueFromDate === 'string' ? new Date(dueFromDate) : dueFromDate

  const rate =
    interestType === 'CONTRACTUAL' && contractualRate != null
      ? contractualRate
      : STATUTORY_RATE

  const rawDays = differenceInDays(asOf, fromDate)
  const days = Math.max(0, rawDays)

  const interest = Math.round(principalAmount * rate * (days / 365) * 100) / 100
  const total = Math.round((principalAmount + interest) * 100) / 100

  return {
    principal: principalAmount,
    rate,
    days,
    interest,
    total,
    asOfDate: asOf.toISOString().split('T')[0],
  }
}
