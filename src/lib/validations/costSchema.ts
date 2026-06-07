import { z } from 'zod'
import { CostType } from '@prisma/client'

// ─── Create Legal Cost ────────────────────────────────────────────────────────

export const createCostSchema = z.object({
  costType: z.nativeEnum(CostType, {
    required_error: 'costType is required',
  }),
  description: z
    .string({ required_error: 'description is required' })
    .min(1, 'description must not be empty')
    .max(500, 'description must be 500 characters or fewer'),
  amount: z
    .number({ required_error: 'amount is required' })
    .positive('amount must be positive'),
  incurredAt: z
    .string()
    .refine(
      (v) => !isNaN(Date.parse(v)),
      { message: 'incurredAt must be a valid date string' }
    )
    .optional(),
})

export type CreateCostInput = z.infer<typeof createCostSchema>

// ─── Update Legal Cost ────────────────────────────────────────────────────────

export const updateCostSchema = z
  .object({
    description: z
      .string()
      .min(1, 'description must not be empty')
      .max(500, 'description must be 500 characters or fewer')
      .optional(),
    amount: z.number().positive('amount must be positive').optional(),
    recovered: z.boolean().optional(),
    recoveredAt: z
      .string()
      .refine(
        (v) => !isNaN(Date.parse(v)),
        { message: 'recoveredAt must be a valid date string' }
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If recovered is being set to true, recoveredAt should be provided (or can be set server-side)
      // If recoveredAt is explicitly provided, recovered should be true
      if (data.recoveredAt != null && data.recovered === false) {
        return false
      }
      return true
    },
    {
      message: 'recovered must be true when recoveredAt is provided',
      path: ['recovered'],
    }
  )

export type UpdateCostInput = z.infer<typeof updateCostSchema>
