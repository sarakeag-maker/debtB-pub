import { InstructionStage, DebtType, CostType } from '@prisma/client'

// ─── Instruction ─────────────────────────────────────────────────────────────

export interface InstructionSummary {
  id: string
  reference: string
  leaseholderName: string
  propertyAddress: string
  currentStage: InstructionStage
  debtType: DebtType
  principalAmount: number
  dueFromDate: Date
  createdAt: Date
  updatedAt: Date
  totalCosts: number
  totalRecovered: number
}

export interface InstructionDetail extends InstructionSummary {
  stageHistories: StageHistoryEntry[]
  legalCosts: LegalCostEntry[]
  letters: LetterEntry[]
}

export interface LetterEntry {
  id: string
  stage: InstructionStage
  generatedAt: Date
  storageUrl?: string | null
}

// ─── Stage History ────────────────────────────────────────────────────────────

export interface StageHistoryEntry {
  id: string
  fromStage: InstructionStage | null
  toStage: InstructionStage
  changedBy: {
    name: string
  }
  notes: string | null
  changedAt: Date
}

// ─── Legal Cost ───────────────────────────────────────────────────────────────

export interface LegalCostEntry {
  id: string
  costType: CostType
  description: string
  amount: number
  recovered: boolean
  recoveredAt: Date | null
  incurredAt: Date
  addedBy: {
    name: string
  }
}

// ─── Interest ─────────────────────────────────────────────────────────────────

export interface InterestResult {
  principal: number
  rate: number
  days: number
  interest: number
  total: number
  asOfDate: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  debtByStage: Record<string, number>
  instructionCountByStage: Record<string, number>
  totalPrincipal: number
  totalInterestAccrued: number
  totalLegalCosts: number
  totalCostsRecovered: number
  recoveryRate: number
  resolvedCount: number
  activeCount: number
  debtByCategory: Record<string, number>
  monthlyResolutions: {
    month: string
    count: number
    amountRecovered: number
  }[]
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  batchId: string
  processed: number
  errors: {
    row: number
    message: string
  }[]
}

// ─── Filter State ─────────────────────────────────────────────────────────────

export interface FilterState {
  stage?: string
  debtType?: string
  search?: string
  page: number
}
