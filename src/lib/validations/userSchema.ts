import { z } from 'zod'
import { Role } from '@prisma/client'

// ─── Create User ──────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z
    .string({ required_error: 'email is required' })
    .email('email must be a valid email address')
    .max(254, 'email must be 254 characters or fewer'),
  password: z
    .string({ required_error: 'password is required' })
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be 128 characters or fewer'),
  name: z
    .string({ required_error: 'name is required' })
    .min(1, 'name must not be empty')
    .max(100, 'name must be 100 characters or fewer'),
  role: z.nativeEnum(Role, {
    required_error: 'role is required',
  }),
  firmId: z
    .string({ required_error: 'firmId is required' })
    .min(1, 'firmId must not be empty'),
  active: z.boolean().optional().default(true),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ─── Update User ──────────────────────────────────────────────────────────────

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email('email must be a valid email address')
      .max(254, 'email must be 254 characters or fewer')
      .optional(),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .max(128, 'password must be 128 characters or fewer')
      .optional(),
    name: z
      .string()
      .min(1, 'name must not be empty')
      .max(100, 'name must be 100 characters or fewer')
      .optional(),
    role: z.nativeEnum(Role).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

export type UpdateUserInput = z.infer<typeof updateUserSchema>
