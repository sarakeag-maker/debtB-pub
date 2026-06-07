import { PrismaClient } from '@prisma/client'
import prisma from './prisma'

/**
 * Generates a unique instruction reference in the format DR-YYYY-NNNNN.
 *
 * Finds the highest existing sequence number for the current year and firm,
 * increments it by one, and returns the formatted reference string.
 *
 * @param firmId       - The firm for which to generate the reference.
 * @param prismaClient - Optional Prisma client (e.g. a transaction client).
 *                       Defaults to the global singleton.
 */
export async function generateReference(
  firmId: string,
  prismaClient?: PrismaClient
): Promise<string> {
  const client = prismaClient ?? prisma
  const year = new Date().getFullYear()
  const prefix = `DR-${year}-`

  // Find the highest sequence number currently in use for this firm + year
  const latest = await (client as PrismaClient).instruction.findFirst({
    where: {
      firmId,
      reference: {
        startsWith: prefix,
      },
    },
    orderBy: {
      reference: 'desc',
    },
    select: {
      reference: true,
    },
  })

  let nextSeq = 1

  if (latest?.reference) {
    // Extract the numeric part after DR-YYYY-
    const parts = latest.reference.split('-')
    const lastNum = parseInt(parts[2], 10)
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1
    }
  }

  // Zero-pad to 5 digits
  const paddedSeq = String(nextSeq).padStart(5, '0')
  return `${prefix}${paddedSeq}`
}
