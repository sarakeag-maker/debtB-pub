import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { assertRole, handleApiError } from '@/lib/permissions'
import { parseCSVBuffer } from '@/lib/csvParser'
import { DebtCategory } from '@prisma/client'

/**
 * Extracts postcode and addressLine1 from a property address string.
 * Attempts to find a UK postcode at the end of the string.
 * Falls back to splitting on the last comma.
 */
function parsePropertyAddress(address: string): {
  addressLine1: string
  postcode: string
} {
  const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\s*$/i
  const match = address.match(postcodeRegex)

  if (match) {
    const postcode = match[1].trim().toUpperCase()
    const addressLine1 = address.slice(0, match.index).replace(/,\s*$/, '').trim()
    return { addressLine1: addressLine1 || address.trim(), postcode }
  }

  // Fall back: split on last comma
  const parts = address.split(',').map((p) => p.trim())
  if (parts.length >= 2) {
    const potentialPostcode = parts[parts.length - 1]
    const addressLine1 = parts.slice(0, -1).join(', ')
    return { addressLine1, postcode: potentialPostcode }
  }

  return { addressLine1: address.trim(), postcode: '' }
}

function parseCategoryEnum(raw: string | undefined): DebtCategory {
  const validValues: DebtCategory[] = [
    'SERVICE_CHARGE',
    'GROUND_RENT',
    'ADMINISTRATION_CHARGE',
    'INSURANCE_CONTRIBUTION',
    'OTHER',
  ]
  if (raw) {
    const upper = raw.toUpperCase() as DebtCategory
    if (validValues.includes(upper)) return upper
  }
  return 'OTHER'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    assertRole(session, 'SOLICITOR', 'MANAGING_AGENT')

    const role = session!.user.role
    const firmId = session!.user.firmId
    const userId = session!.user.id

    // 1. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 3. Parse CSV
    const { rows, errors: parseErrors } = parseCSVBuffer(buffer)

    // 4. Create ImportBatch record
    const batch = await prisma.importBatch.create({
      data: {
        uploadedById: userId,
        fileName: file.name,
        rowCount: rows.length,
        status: 'PENDING',
      },
    })

    const rowErrors: { row: number; message: string }[] = [...parseErrors]
    let processedCount = 0

    // 5. Process each valid row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const csvRow = i + 2 // data rows start at row 2

      try {
        const amount = parseFloat(row.amount.replace(/[£$,]/g, ''))
        if (isNaN(amount) || amount <= 0) {
          rowErrors.push({ row: csvRow, message: `Invalid amount: ${row.amount}` })
          continue
        }

        const fromDate = new Date(row.fromDate)
        if (isNaN(fromDate.getTime())) {
          rowErrors.push({ row: csvRow, message: `Invalid fromDate: ${row.fromDate}` })
          continue
        }

        const toDate = row.toDate ? new Date(row.toDate) : null
        const { addressLine1, postcode } = parsePropertyAddress(row.propertyAddress)
        const category = parseCategoryEnum(row.category)

        await prisma.$transaction(async (tx) => {
          // Upsert Property: find by firmId + addressLine1 + postcode or create
          let property = await tx.property.findFirst({
            where: { firmId, addressLine1, postcode },
          })
          if (!property) {
            property = await tx.property.create({
              data: { firmId, addressLine1, postcode },
            })
          }

          // Upsert Unit: find by propertyId + flatRef or create/update
          const unit = await tx.unit.upsert({
            where: {
              propertyId_flatRef: {
                propertyId: property.id,
                flatRef: row.flatRef,
              },
            },
            update: {
              leaseholderName: row.leaseholderName,
            },
            create: {
              propertyId: property.id,
              flatRef: row.flatRef,
              leaseholderName: row.leaseholderName,
            },
          })

          // Create DebtEntry
          await tx.debtEntry.create({
            data: {
              unitId: unit.id,
              importBatchId: batch.id,
              description: row.description || 'Imported debt entry',
              amount,
              category,
              dueFromDate: fromDate,
              dueToDate: toDate ?? undefined,
            },
          })

          // If MANAGING_AGENT, create PropertyAgent link if not exists
          if (role === 'MANAGING_AGENT') {
            await tx.propertyAgent.upsert({
              where: {
                propertyId_userId: {
                  propertyId: property.id,
                  userId,
                },
              },
              update: {},
              create: {
                propertyId: property.id,
                userId,
              },
            })
          }
        })

        processedCount++
      } catch (rowError) {
        rowErrors.push({
          row: csvRow,
          message:
            rowError instanceof Error
              ? rowError.message
              : 'Unknown error processing row',
        })
      }
    }

    // 6. Update ImportBatch with final counts and status
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        rowCount: processedCount,
        status: processedCount > 0 ? 'PROCESSED' : 'FAILED',
        errorLog: rowErrors.length > 0 ? JSON.stringify(rowErrors) : null,
      },
    })

    // 7. Return ImportResult
    return Response.json({
      batchId: batch.id,
      processed: processedCount,
      errors: rowErrors,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
