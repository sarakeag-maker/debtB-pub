import { z } from 'zod'
import { DebtType, DebtCategory, InterestType, InstructionStage } from '@prisma/client'

// ─── Create Instruction ───────────────────────────────────────────────────────

export const createInstructionSchema = z.object({
  unitId: z.string().min(1, 'unitId is required'),
  debtEntryId: z.string().optional(),
  principalAmount: z
    .number({ required_error: 'principalAmount is required' })
    .positive('principalAmount must be positive'),
  debtType: z.nativeEnum(DebtType).default('UNDISPUTED'),
  debtCategory: z.nativeEnum(DebtCategory, {
    required_error: 'debtCategory is required',
  }),
  dueFromDate: z
    .string({ required_error: 'dueFromDate is required' })
    .refine(
      (v) => !isNaN(Date.parse(v)),
      { message: 'dueFromDate must be a valid date string' }
    ),
  interestType: z.nativeEnum(InterestType).default('STATUTORY'),
  contractualRate: z
    .number()
    .min(0, 'contractualRate must be >= 0')
    .max(1, 'contractualRate must be <= 1')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateInstructionInput = z.infer<typeof createInstructionSchema>

// ─── Update Instruction ───────────────────────────────────────────────────────

export const updateInstructionSchema = z
  .object({
    debtType: z.nativeEnum(DebtType).optional(),
    interestType: z.nativeEnum(InterestType).optional(),
    contractualRate: z
      .number()
      .min(0, 'contractualRate must be >= 0')
      .max(1, 'contractualRate must be <= 1')
      .optional()
      .nullable(),
    notes: z.string().optional().nullable(),
    resolvedAmount: z
      .number()
      .nonnegative('resolvedAmount must be >= 0')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // contractualRate is only meaningful when interestType is CONTRACTUAL
      if (
        data.interestType === InterestType.CONTRACTUAL &&
        data.contractualRate == null
      ) {
        return false
      }
      return true
    },
    {
      message:
        'contractualRate is required when interestType is CONTRACTUAL',
      path: ['contractualRate'],
    }
  )

export type UpdateInstructionInput = z.infer<typeof updateInstructionSchema>

// ─── Advance Stage ────────────────────────────────────────────────────────────

export const advanceStageSchema = z.object({
  toStage: z.nativeEnum(InstructionStage, {
    required_error: 'toStage is required',
  }),
  notes: z.string().optional().nullable(),
})

export type AdvanceStageInput = z.infer<typeof advanceStageSchema>
