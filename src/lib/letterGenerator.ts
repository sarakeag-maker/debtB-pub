import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import { InstructionStage } from '@prisma/client'

export interface LetterContext {
  reference: string
  leaseholderName: string
  propertyAddress: string
  flatRef: string
  principal: number
  interest: number
  total: number
  totalCosts: number
  firmName: string
  firmAddress: string
  firmPhone: string
  firmEmail: string
  stage: InstructionStage
  date: Date
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(n)
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function p(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold })],
  })
}

function blank(): Paragraph {
  return new Paragraph({ text: '' })
}

function buildStageBody(ctx: LetterContext): Paragraph[] {
  const {
    stage,
    reference,
    leaseholderName,
    propertyAddress,
    principal,
    interest,
    total,
    totalCosts,
  } = ctx

  switch (stage) {
    case InstructionStage.DEMAND_LETTER:
      return [
        p(`RE: Outstanding Arrears – ${propertyAddress}`, true),
        blank(),
        p(
          `We write to you in connection with outstanding arrears due in respect of the above property.`
        ),
        blank(),
        p(
          `Our records confirm that the sum of ${fmt(principal)} remains outstanding as principal. Interest has accrued at 8% per annum pursuant to section 69 of the County Courts Act 1984, bringing the total amount now due to ${fmt(total)}.`
        ),
        blank(),
        p(
          `We require payment of the full sum of ${fmt(total)} within 14 days of the date of this letter. Cheques should be made payable to our client, or payment may be made by bank transfer to the details provided separately.`
        ),
        blank(),
        p(
          `If you are unable to pay the full amount, please contact us immediately to discuss a payment arrangement. We may be able to agree a payment plan with our client's approval, provided you contact us within the 14-day period.`
        ),
        blank(),
        p(
          `Please be advised that our client is entitled to interest on the sum outstanding at the rate of 8% per annum. Interest will continue to accrue until the date of payment or judgment.`
        ),
        blank(),
        p(
          `If you fail to respond or make payment within the time specified, we are instructed to take further steps to recover the debt, which may include the issue of court proceedings. Additional costs and court fees will be added to the debt and you may be liable for those costs.`
        ),
        blank(),
        p(
          `If you have already made payment, please disregard this notice and accept our apologies for any inconvenience caused.`
        ),
      ]

    case InstructionStage.LETTER_BEFORE_ACTION:
      return [
        p(`RE: Letter Before Action – ${propertyAddress}`, true),
        blank(),
        p(
          `This letter is sent in compliance with the Pre-Action Protocol for Debt Claims. You should read it carefully and take independent legal advice if necessary.`
        ),
        blank(),
        p(
          `We act for our client in connection with the above property. Despite previous correspondence, the debt due remains unpaid. The total amount now outstanding is ${fmt(total)}, which comprises:`
        ),
        blank(),
        p(`  Principal arrears:       ${fmt(principal)}`),
        p(`  Interest accrued:        ${fmt(interest)}`),
        p(`  Legal costs and charges: ${fmt(totalCosts)}`),
        p(`  TOTAL:                   ${fmt(total)}`, true),
        blank(),
        p(
          `You have 30 days from the date of this letter to respond or to make payment of the full amount outstanding. You may respond by:`
        ),
        blank(),
        p(`  (a) paying the sum in full;`),
        p(`  (b) proposing a payment arrangement, supported by a completed income and expenditure statement;`),
        p(`  (c) disputing the debt, with full written reasons and supporting documentation.`),
        blank(),
        p(
          `If you dispute the debt, or any part of it, please notify us within 30 days setting out the full grounds of your dispute and providing any documents you rely upon. We will provide copies of the documents we hold on request.`
        ),
        blank(),
        p(
          `If we do not hear from you, or if the debt is not paid in full, we are instructed to issue court proceedings in the County Court without further notice. If judgment is obtained against you, it will be registered on your credit record and enforcement action may follow, including attachment of earnings, charging orders over the property, or third party debt orders.`
        ),
        blank(),
        p(
          `We also invite you to consider alternative dispute resolution (ADR). If you wish to explore mediation or another form of ADR, please let us know within the 30-day period.`
        ),
        blank(),
        p(
          `This letter constitutes formal notice under the Pre-Action Protocol for Debt Claims. If proceedings are issued and you fail to comply with this Protocol, the court may take this into account when making any costs order.`
        ),
      ]

    case InstructionStage.CHASER:
      return [
        p(`RE: Reminder – Outstanding Debt – ${propertyAddress}`, true),
        blank(),
        p(
          `We refer to our previous correspondence and write to remind you that the debt in respect of the above property remains unpaid.`
        ),
        blank(),
        p(
          `Despite our earlier letters, we have received neither payment nor any response from you. The total sum now outstanding, including accrued interest and costs, is ${fmt(total)}.`
        ),
        blank(),
        p(
          `We require payment of the full amount of ${fmt(total)} within 7 days of the date of this letter.`
        ),
        blank(),
        p(
          `We must warn you in the clearest possible terms that if payment is not received, or satisfactory proposals for payment are not made, within 7 days, we will issue court proceedings against you without further notice. You will then also become liable for court fees and any further legal costs, which will increase the total amount you owe.`
        ),
        blank(),
        p(
          `To avoid this outcome, please contact us urgently on the details above to arrange immediate payment or to discuss your circumstances.`
        ),
      ]

    case InstructionStage.DRAFT_CLAIM:
      return [
        p(`RE: Final Warning Before Proceedings – ${propertyAddress}`, true),
        blank(),
        p(
          `This is a final warning letter. Court proceedings are now being prepared against you for the recovery of the sum of ${fmt(total)}.`
        ),
        blank(),
        p(
          `We enclose (by way of information) a summary of the draft Claim Form which is being prepared. This sets out the claimant, the defendant, the amount claimed, and the basis of the claim. You should review this carefully.`
        ),
        blank(),
        p(
          `Once the claim is issued, additional court fees will be added to the debt. At the current claim value, court fees will be in addition to the amounts already claimed. You will be liable for these further costs if judgment is obtained against you.`
        ),
        blank(),
        p(
          `This is your final opportunity to settle this matter without the additional expense and inconvenience of court proceedings. You have 7 days from the date of this letter to make payment in full or to contact us with a proposal.`
        ),
        blank(),
        p(
          `If we do not receive payment or a satisfactory proposal within 7 days, the claim will be issued at the County Court Business Centre without further notice.`
        ),
        blank(),
        p(
          `We strongly urge you to seek independent legal advice immediately if you have not already done so.`
        ),
      ]

    case InstructionStage.CLAIM_ISSUED:
      return [
        p(`RE: Claim Issued – ${reference}`, true),
        blank(),
        p(
          `We write to inform you that a claim has been issued against you in the County Court in respect of the outstanding debt relating to the above property.`
        ),
        blank(),
        p(`Claim Reference: ${reference}`),
        blank(),
        p(
          `The claim has been issued at the County Court Business Centre. The court will serve the Claim Form on you separately. You will receive official court documentation including the Claim Form (N1) and Response Pack.`
        ),
        blank(),
        p(
          `You have 14 days from the date of service of the Claim Form to file an Acknowledgement of Service with the court. If you wish to defend the claim, you must also file a Defence within 28 days of service (or within 28 days of filing an Acknowledgement of Service if filed within 14 days of service).`
        ),
        blank(),
        p(
          `If you do not respond within the required time, our client will apply for judgment in default against you, without further notice. A default judgment will be entered against you on the court record.`
        ),
        blank(),
        p(
          `We strongly advise you to take independent legal advice as a matter of urgency if you have not already done so. Free legal advice may be available through Citizens Advice or a local law centre.`
        ),
        blank(),
        p(
          `If you wish to settle this matter, it is not too late to contact us. Any payment or settlement agreed at this stage will avoid further costs being added to the claim.`
        ),
      ]

    case InstructionStage.ENFORCEMENT:
      return [
        p(`RE: Enforcement Action – ${reference}`, true),
        blank(),
        p(
          `We write to inform you that judgment has been obtained against you in the above proceedings and that enforcement action has been or will shortly be instructed.`
        ),
        blank(),
        p(
          `As judgment has been entered against you, the full amount of the judgment debt, together with any further accrued interest and costs, is now immediately payable.`
        ),
        blank(),
        p(
          `We are considering, or have instructed, one or more of the following methods of enforcement:`
        ),
        blank(),
        p(`  (a) Warrant of Control / Writ of Control (Bailiff enforcement) – instructing enforcement agents to attend at the property to seize and sell goods to the value of the judgment debt;`),
        p(`  (b) Charging Order – applying to the court for a charging order over the property, which, if granted, may ultimately lead to an order for sale;`),
        p(`  (c) Third Party Debt Order – applying to freeze and recover monies held in bank accounts or held by third parties.`),
        blank(),
        p(
          `To prevent enforcement action proceeding, you must pay the full judgment debt immediately. If payment is made in full we will take no further action.`
        ),
        blank(),
        p(
          `Please contact us immediately to arrange payment or to discuss this matter. Time is of the essence and further delay will increase the costs for which you are liable.`
        ),
      ]

    case InstructionStage.RESOLVED:
      return [
        p(`RE: Settlement Confirmation – ${reference}`, true),
        blank(),
        p(
          `We are pleased to confirm that the above matter has now been resolved and that our instructions in connection with the recovery of the outstanding debt have been concluded.`
        ),
        blank(),
        p(`The total amount recovered is: ${fmt(total)}`, true),
        blank(),
        p(
          `We confirm that we have received payment in full and satisfaction of the debt. This matter is now closed and no further action will be taken.`
        ),
        blank(),
        p(
          `We thank you for your prompt resolution of this matter. If you have any queries about this confirmation letter, please do not hesitate to contact us.`
        ),
      ]

    default:
      return [
        p(`RE: Instruction Reference – ${reference}`, true),
        blank(),
        p(`We write in connection with the above matter. Please contact us for further information.`),
      ]
  }
}

/**
 * Generates a .docx letter buffer for the given letter context.
 */
export async function generateLetterBuffer(ctx: LetterContext): Promise<Buffer> {
  const stageBodyParagraphs = buildStageBody(ctx)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ── Firm header ───────────────────────────────────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: ctx.firmName, bold: true })],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [new TextRun({ text: ctx.firmAddress })],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tel: ${ctx.firmPhone}` })],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Email: ${ctx.firmEmail}` })],
            alignment: AlignmentType.RIGHT,
          }),

          blank(),

          // ── Date (right-aligned) and reference ────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: fmtDate(ctx.date) })],
            alignment: AlignmentType.RIGHT,
          }),

          blank(),

          new Paragraph({
            children: [
              new TextRun({ text: 'Our Reference: ', bold: true }),
              new TextRun({ text: ctx.reference }),
            ],
          }),

          blank(),

          // ── Addressee block ───────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: ctx.leaseholderName, bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: ctx.propertyAddress })],
          }),

          blank(),

          // ── Salutation ────────────────────────────────────────────────────
          new Paragraph({
            children: [
              new TextRun({ text: `Dear ${ctx.leaseholderName},` }),
            ],
          }),

          blank(),

          // ── Stage-specific body ───────────────────────────────────────────
          ...stageBodyParagraphs,

          blank(),

          // ── Sign-off ──────────────────────────────────────────────────────
          new Paragraph({
            children: [new TextRun({ text: 'Yours faithfully,' })],
          }),
          blank(),
          blank(),
          new Paragraph({
            children: [new TextRun({ text: ctx.firmName, bold: true })],
          }),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
