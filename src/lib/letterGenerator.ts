import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import { InstructionStage } from '@prisma/client'
import { InterestResult } from '@/types'

export interface LetterContext {
  reference: string
  stage: InstructionStage
  leaseholderName: string
  propertyAddress: string
  firmName: string
  firmAddress: string | null | undefined
  firmPhone: string | null | undefined
  firmEmail: string | null | undefined
  principalAmount: number
  interestResult: InterestResult
  totalLegalCosts: number
  generatedDate: string
}

const STAGE_SUBJECT: Record<InstructionStage, string> = {
  DEMAND_LETTER: 'Formal Demand for Payment',
  LETTER_BEFORE_ACTION: 'Letter Before Action',
  CHASER: 'Chaser Notice – Outstanding Debt',
  DRAFT_CLAIM: 'Notice of Intended Court Proceedings',
  CLAIM_ISSUED: 'Notice of Court Proceedings Issued',
  ENFORCEMENT: 'Notice of Enforcement Action',
  RESOLVED: 'Confirmation of Resolution',
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Generates a .docx letter buffer for the given letter context.
 */
export async function generateLetterBuffer(ctx: LetterContext): Promise<Buffer> {
  const subject = STAGE_SUBJECT[ctx.stage] ?? ctx.stage
  const totalOwed = ctx.principalAmount + ctx.interestResult.interest + ctx.totalLegalCosts

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header – firm info
          new Paragraph({
            children: [new TextRun({ text: ctx.firmName, bold: true, size: 28 })],
            alignment: AlignmentType.RIGHT,
          }),
          ...(ctx.firmAddress
            ? [
                new Paragraph({
                  children: [new TextRun({ text: ctx.firmAddress, size: 20 })],
                  alignment: AlignmentType.RIGHT,
                }),
              ]
            : []),
          ...(ctx.firmPhone
            ? [
                new Paragraph({
                  children: [new TextRun({ text: `Tel: ${ctx.firmPhone}`, size: 20 })],
                  alignment: AlignmentType.RIGHT,
                }),
              ]
            : []),
          ...(ctx.firmEmail
            ? [
                new Paragraph({
                  children: [new TextRun({ text: `Email: ${ctx.firmEmail}`, size: 20 })],
                  alignment: AlignmentType.RIGHT,
                }),
              ]
            : []),

          new Paragraph({ text: '' }),

          // Recipient
          new Paragraph({
            children: [new TextRun({ text: ctx.leaseholderName, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: ctx.propertyAddress })],
          }),

          new Paragraph({ text: '' }),

          // Date
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${formatDate(ctx.generatedDate)}` }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Reference
          new Paragraph({
            children: [
              new TextRun({ text: `Our Reference: `, bold: true }),
              new TextRun({ text: ctx.reference }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Subject line
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: subject, bold: true })],
          }),

          new Paragraph({ text: '' }),

          // Salutation
          new Paragraph({
            children: [
              new TextRun({ text: `Dear ${ctx.leaseholderName},` }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Body
          new Paragraph({
            children: [
              new TextRun({
                text: `We write on behalf of our client in connection with outstanding service charges and/or ground rent arrears due in respect of the above-referenced property.`,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Debt breakdown table (as paragraphs for simplicity)
          new Paragraph({
            children: [new TextRun({ text: 'Summary of Amounts Due', bold: true })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Principal Amount Outstanding:    ${formatCurrency(ctx.principalAmount)}`,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Interest Accrued (${(ctx.interestResult.rate * 100).toFixed(2)}% p.a., ${ctx.interestResult.days} days):    ${formatCurrency(ctx.interestResult.interest)}`,
              }),
            ],
          }),
          ...(ctx.totalLegalCosts > 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Legal Costs:    ${formatCurrency(ctx.totalLegalCosts)}`,
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({
                text: `TOTAL NOW DUE:    ${formatCurrency(totalOwed)}`,
                bold: true,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Call to action
          new Paragraph({
            children: [
              new TextRun({
                text: `We require payment of the above sum within 14 days of the date of this letter. If payment is not received we reserve the right to take further action without further notice, which may include the issue of court proceedings, recovery of additional costs and interest.`,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          new Paragraph({
            children: [
              new TextRun({
                text: `If you believe this notice has been sent to you in error, or you wish to discuss a payment arrangement, please contact us immediately using the details above.`,
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // Sign-off
          new Paragraph({
            children: [new TextRun({ text: 'Yours faithfully,' })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: ctx.firmName, bold: true })],
          }),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
