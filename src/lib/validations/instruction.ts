import { z } from 'zod'
import { DebtType, DebtCategory, InterestType } from '@prisma/client'

export const createInstructionSchema = z.object({
  unitId: z.string().min(1, 'unitId is required'),
  debtEntryId: z.string().optional(),
  principalAmount: z.number().positive('principalAmount must be positive'),
  debtType: z.nativeEnum(DebtType).default('UNDISPUTED'),
  debtCategory: z.nativeEnum(DebtCategory),
  dueFromDate: z.string().datetime({ offset: true }).or(z.string().date()),
  interestType: z.nativeEnum(InterestType).default('STATUTORY'),
  contractualRate: z.number().min(0).max(1).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateInstructionInput = z.infer<typeof createInstructionSchema>

export const updateInstructionSchema = z.object({
  debtType: z.nativeEnum(DebtType).optional(),
  interestType: z.nativeEnum(InterestType).optional(),
  contractualRate: z.number().min(0).max(1).optional().nullable(),
  notes: z.string().optional().nullable(),
  resolvedAmount: z.number().nonnegative().optional().nullable(),
})

export type UpdateInstructionInput = z.infer<typeof updateInstructionSchema>

export const createLegalCostSchema = z.object({
  costType: z.enum(['FIXED_FEE', 'HOURLY', 'DISBURSEMENT', 'COURT_FEE']),
  description: z.string().min(1, 'description is required'),
  amount: z.number().positive('amount must be positive'),
  incurredAt: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
})

export type CreateLegalCostInput = z.infer<typeof createLegalCostSchema>

export const updateLegalCostSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  recovered: z.boolean().optional(),
  recoveredAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
})

export type UpdateLegalCostInput = z.infer<typeof updateLegalCostSchema>
