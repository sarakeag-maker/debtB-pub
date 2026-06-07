import { z } from 'zod'
import { DebtCategory } from '@prisma/client'

// ─── Import Row ───────────────────────────────────────────────────────────────

/**
 * Validates a single parsed CSV row before it is committed to the database.
 */
export const importRowSchema = z.object({
  propertyAddress: z
    .string({ required_error: 'propertyAddress is required' })
    .min(1, 'propertyAddress must not be empty'),
  flatRef: z
    .string({ required_error: 'flatRef is required' })
    .min(1, 'flatRef must not be empty'),
  leaseholderName: z
    .string({ required_error: 'leaseholderName is required' })
    .min(1, 'leaseholderName must not be empty'),
  description: z.string().optional().default(''),
  amount: z
    .string({ required_error: 'amount is required' })
    .refine(
      (v) => {
        const n = parseFloat(v.replace(/[^0-9.-]/g, ''))
        return !isNaN(n) && n > 0
      },
      { message: 'amount must be a positive number' }
    ),
  fromDate: z
    .string({ required_error: 'fromDate is required' })
    .refine(
      (v) => !isNaN(Date.parse(v)),
      { message: 'fromDate must be a valid date string' }
    ),
  toDate: z
    .string()
    .refine(
      (v) => !isNaN(Date.parse(v)),
      { message: 'toDate must be a valid date string' }
    )
    .optional(),
  category: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.nativeEnum(DebtCategory))
    .optional(),
})

export type ImportRowInput = z.infer<typeof importRowSchema>

// ─── Confirm Import ───────────────────────────────────────────────────────────

/**
 * Validates the request body when the user confirms (commits) a pending import batch.
 */
export const confirmImportSchema = z.object({
  batchId: z
    .string({ required_error: 'batchId is required' })
    .min(1, 'batchId must not be empty'),
  /**
   * Optional: allow the caller to specify which row indices (0-based within
   * the validated rows array) should be skipped on confirm. Useful for
   * UI flows where the user reviews errors and deselects individual rows.
   */
  skipRowIndices: z.array(z.number().int().nonnegative()).optional().default([]),
})

export type ConfirmImportInput = z.infer<typeof confirmImportSchema>
