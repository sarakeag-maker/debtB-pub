import { PrismaClient, InstructionStage, DebtCategory, DebtType, InterestType, CostType, ImportStatus, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── Firm ────────────────────────────────────────────────────────────────────
  const firm = await prisma.firm.create({
    data: {
      name: 'Harrison & Partners Solicitors',
      address: '12 Legal Lane, London, EC1A 1BB',
      phone: '020 7123 4567',
      email: 'info@harrisonpartners.co.uk',
    },
  })
  console.log('Created firm:', firm.name)

  // ─── Users ───────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12)

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@harrisonpartners.co.uk',
      passwordHash,
      name: 'Sarah Harrison',
      role: Role.SOLICITOR,
      firmId: firm.id,
    },
  })

  const client = await prisma.user.create({
    data: {
      email: 'client@eastfieldestates.co.uk',
      passwordHash,
      name: 'Eastfield Estates',
      role: Role.CLIENT,
      firmId: firm.id,
    },
  })

  const john = await prisma.user.create({
    data: {
      email: 'john@propertymanage.co.uk',
      passwordHash,
      name: 'John Managing',
      role: Role.MANAGING_AGENT,
      firmId: firm.id,
    },
  })
  console.log('Created users:', sarah.name, ',', client.name, ',', john.name)

  // ─── Properties ──────────────────────────────────────────────────────────────
  const riversideCourt = await prisma.property.create({
    data: {
      firmId: firm.id,
      buildingName: 'Riverside Court',
      addressLine1: '10 River Lane',
      city: 'London',
      postcode: 'E1 2AB',
    },
  })

  const maltings = await prisma.property.create({
    data: {
      firmId: firm.id,
      buildingName: 'The Maltings',
      addressLine1: '25 Old Brewery Road',
      city: 'London',
      postcode: 'SE1 4CD',
    },
  })

  const victoriaHouse = await prisma.property.create({
    data: {
      firmId: firm.id,
      buildingName: 'Victoria House',
      addressLine1: '88 Victoria Street',
      city: 'London',
      postcode: 'SW1 3EF',
    },
  })

  const parkView = await prisma.property.create({
    data: {
      firmId: firm.id,
      buildingName: 'Park View Apartments',
      addressLine1: '3 Parkside Drive',
      city: 'London',
      postcode: 'N1 5GH',
    },
  })

  const canalQuarter = await prisma.property.create({
    data: {
      firmId: firm.id,
      buildingName: 'Canal Quarter',
      addressLine1: '55 Towpath Road',
      city: 'London',
      postcode: 'E14 6IJ',
    },
  })
  console.log('Created 5 properties')

  // ─── PropertyAgent links ──────────────────────────────────────────────────────
  const allProperties = [riversideCourt, maltings, victoriaHouse, parkView, canalQuarter]
  for (const property of allProperties) {
    await prisma.propertyAgent.create({
      data: {
        propertyId: property.id,
        userId: john.id,
      },
    })
  }
  console.log('Linked John Managing to all 5 properties')

  // ─── Units ───────────────────────────────────────────────────────────────────

  // Riverside Court units
  const rc1a = await prisma.unit.create({
    data: {
      propertyId: riversideCourt.id,
      flatRef: 'Flat 1A',
      leaseholderName: 'James Thornton',
    },
  })
  const rc1b = await prisma.unit.create({
    data: {
      propertyId: riversideCourt.id,
      flatRef: 'Flat 1B',
      leaseholderName: 'Emily Watkins',
    },
  })
  const rc2a = await prisma.unit.create({
    data: {
      propertyId: riversideCourt.id,
      flatRef: 'Flat 2A',
      leaseholderName: 'Robert Chen',
    },
  })
  const rc2b = await prisma.unit.create({
    data: {
      propertyId: riversideCourt.id,
      flatRef: 'Flat 2B',
      leaseholderName: 'Amanda Patel',
    },
  })

  // The Maltings units
  const m1 = await prisma.unit.create({
    data: {
      propertyId: maltings.id,
      flatRef: 'Flat 1',
      leaseholderName: 'David Okafor',
    },
  })
  const m2 = await prisma.unit.create({
    data: {
      propertyId: maltings.id,
      flatRef: 'Flat 2',
      leaseholderName: 'Lisa Ng',
    },
  })
  const m3 = await prisma.unit.create({
    data: {
      propertyId: maltings.id,
      flatRef: 'Flat 3',
      leaseholderName: 'Marcus Webb',
    },
  })

  // Victoria House units
  const v1 = await prisma.unit.create({
    data: {
      propertyId: victoriaHouse.id,
      flatRef: 'Flat 1',
      leaseholderName: 'Sophie Clarke',
    },
  })
  const v2 = await prisma.unit.create({
    data: {
      propertyId: victoriaHouse.id,
      flatRef: 'Flat 2',
      leaseholderName: 'Michael Hughes',
    },
  })

  // Park View units
  const pv1 = await prisma.unit.create({
    data: {
      propertyId: parkView.id,
      flatRef: 'Apt 1',
      leaseholderName: 'Priya Sharma',
    },
  })
  const pv2 = await prisma.unit.create({
    data: {
      propertyId: parkView.id,
      flatRef: 'Apt 2',
      leaseholderName: 'Thomas Reid',
    },
  })
  const pv3 = await prisma.unit.create({
    data: {
      propertyId: parkView.id,
      flatRef: 'Apt 3',
      leaseholderName: 'Grace Adeyemi',
    },
  })

  // Canal Quarter units
  const cq1 = await prisma.unit.create({
    data: {
      propertyId: canalQuarter.id,
      flatRef: 'Unit 1',
      leaseholderName: 'Hassan Al-Rashid',
    },
  })
  const cq2 = await prisma.unit.create({
    data: {
      propertyId: canalQuarter.id,
      flatRef: 'Unit 2',
      leaseholderName: 'Fiona McAllister',
    },
  })
  console.log('Created 14 units')

  // ─── ImportBatch ─────────────────────────────────────────────────────────────
  const importBatch = await prisma.importBatch.create({
    data: {
      uploadedById: john.id,
      fileName: 'initial-debt-import.csv',
      rowCount: 14,
      status: ImportStatus.PROCESSED,
    },
  })
  console.log('Created import batch')

  // ─── DebtEntries ─────────────────────────────────────────────────────────────

  const de_rc1a = await prisma.debtEntry.create({
    data: {
      unitId: rc1a.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Riverside Court Flat 1A',
      amount: 1200,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 180),
      dueToDate: subDays(new Date(), 90),
    },
  })

  const de_rc1b = await prisma.debtEntry.create({
    data: {
      unitId: rc1b.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Riverside Court Flat 1B',
      amount: 2400,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 270),
      dueToDate: subDays(new Date(), 180),
    },
  })

  const de_rc2a = await prisma.debtEntry.create({
    data: {
      unitId: rc2a.id,
      importBatchId: importBatch.id,
      description: 'Ground rent arrears - Riverside Court Flat 2A',
      amount: 900,
      category: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 365),
      dueToDate: subDays(new Date(), 270),
    },
  })

  const de_rc2b = await prisma.debtEntry.create({
    data: {
      unitId: rc2b.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Riverside Court Flat 2B',
      amount: 3600,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 400),
      dueToDate: subDays(new Date(), 300),
    },
  })

  const de_m1 = await prisma.debtEntry.create({
    data: {
      unitId: m1.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - The Maltings Flat 1',
      amount: 1800,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 420),
      dueToDate: subDays(new Date(), 330),
    },
  })

  const de_m2 = await prisma.debtEntry.create({
    data: {
      unitId: m2.id,
      importBatchId: importBatch.id,
      description: 'Ground rent arrears - The Maltings Flat 2',
      amount: 2200,
      category: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 480),
      dueToDate: subDays(new Date(), 390),
    },
  })

  const de_m3 = await prisma.debtEntry.create({
    data: {
      unitId: m3.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - The Maltings Flat 3',
      amount: 1500,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 500),
      dueToDate: subDays(new Date(), 410),
    },
  })

  const de_v1 = await prisma.debtEntry.create({
    data: {
      unitId: v1.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Victoria House Flat 1',
      amount: 800,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 180),
      dueToDate: subDays(new Date(), 90),
    },
  })

  const de_v2 = await prisma.debtEntry.create({
    data: {
      unitId: v2.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Victoria House Flat 2',
      amount: 4200,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 360),
      dueToDate: subDays(new Date(), 270),
    },
  })

  const de_pv1 = await prisma.debtEntry.create({
    data: {
      unitId: pv1.id,
      importBatchId: importBatch.id,
      description: 'Ground rent arrears - Park View Apt 1',
      amount: 1100,
      category: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 365),
      dueToDate: subDays(new Date(), 275),
    },
  })

  const de_pv2 = await prisma.debtEntry.create({
    data: {
      unitId: pv2.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Park View Apt 2',
      amount: 2800,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 390),
      dueToDate: subDays(new Date(), 300),
    },
  })

  const de_pv3 = await prisma.debtEntry.create({
    data: {
      unitId: pv3.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Park View Apt 3',
      amount: 1600,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 410),
      dueToDate: subDays(new Date(), 320),
    },
  })

  const de_cq1 = await prisma.debtEntry.create({
    data: {
      unitId: cq1.id,
      importBatchId: importBatch.id,
      description: 'Ground rent arrears - Canal Quarter Unit 1',
      amount: 3100,
      category: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 450),
      dueToDate: subDays(new Date(), 360),
    },
  })

  const de_cq2 = await prisma.debtEntry.create({
    data: {
      unitId: cq2.id,
      importBatchId: importBatch.id,
      description: 'Service charge arrears - Canal Quarter Unit 2',
      amount: 1900,
      category: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 480),
      dueToDate: subDays(new Date(), 390),
    },
  })
  console.log('Created 14 debt entries')

  // ─── Instructions ─────────────────────────────────────────────────────────────

  // 1. Riverside Flat 1A: DEMAND_LETTER, 10 days ago
  const createdAt_rc1a = subDays(new Date(), 10)
  const inst_rc1a = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00001',
      unitId: rc1a.id,
      debtEntryId: de_rc1a.id,
      leaseholderName: 'James Thornton',
      propertyAddress: 'Flat 1A, Riverside Court, 10 River Lane, London, E1 2AB',
      principalAmount: 1200,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 180),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.DEMAND_LETTER,
      createdAt: createdAt_rc1a,
      updatedAt: createdAt_rc1a,
    },
  })

  // 2. Riverside Flat 1B: LETTER_BEFORE_ACTION, 45 days ago
  const createdAt_rc1b = subDays(new Date(), 45)
  const inst_rc1b = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00002',
      unitId: rc1b.id,
      debtEntryId: de_rc1b.id,
      leaseholderName: 'Emily Watkins',
      propertyAddress: 'Flat 1B, Riverside Court, 10 River Lane, London, E1 2AB',
      principalAmount: 2400,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 270),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.LETTER_BEFORE_ACTION,
      createdAt: createdAt_rc1b,
      updatedAt: createdAt_rc1b,
    },
  })

  // 3. Riverside Flat 2A: CHASER, 60 days ago
  const createdAt_rc2a = subDays(new Date(), 60)
  const inst_rc2a = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00003',
      unitId: rc2a.id,
      debtEntryId: de_rc2a.id,
      leaseholderName: 'Robert Chen',
      propertyAddress: 'Flat 2A, Riverside Court, 10 River Lane, London, E1 2AB',
      principalAmount: 900,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 365),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.CHASER,
      createdAt: createdAt_rc2a,
      updatedAt: createdAt_rc2a,
    },
  })

  // 4. Riverside Flat 2B: DRAFT_CLAIM, DISPUTED, 90 days ago
  const createdAt_rc2b = subDays(new Date(), 90)
  const inst_rc2b = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00004',
      unitId: rc2b.id,
      debtEntryId: de_rc2b.id,
      leaseholderName: 'Amanda Patel',
      propertyAddress: 'Flat 2B, Riverside Court, 10 River Lane, London, E1 2AB',
      principalAmount: 3600,
      debtType: DebtType.DISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 400),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.DRAFT_CLAIM,
      createdAt: createdAt_rc2b,
      updatedAt: createdAt_rc2b,
    },
  })

  // 5. Maltings Flat 1: CLAIM_ISSUED, 120 days ago
  const createdAt_m1 = subDays(new Date(), 120)
  const inst_m1 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00005',
      unitId: m1.id,
      debtEntryId: de_m1.id,
      leaseholderName: 'David Okafor',
      propertyAddress: 'Flat 1, The Maltings, 25 Old Brewery Road, London, SE1 4CD',
      principalAmount: 1800,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 420),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.CLAIM_ISSUED,
      createdAt: createdAt_m1,
      updatedAt: createdAt_m1,
    },
  })

  // 6. Maltings Flat 2: ENFORCEMENT, 180 days ago
  const createdAt_m2 = subDays(new Date(), 180)
  const inst_m2 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00006',
      unitId: m2.id,
      debtEntryId: de_m2.id,
      leaseholderName: 'Lisa Ng',
      propertyAddress: 'Flat 2, The Maltings, 25 Old Brewery Road, London, SE1 4CD',
      principalAmount: 2200,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 480),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.ENFORCEMENT,
      createdAt: createdAt_m2,
      updatedAt: createdAt_m2,
    },
  })

  // 7. Maltings Flat 3: RESOLVED, 200 days ago, resolvedAt 30 days ago
  const createdAt_m3 = subDays(new Date(), 200)
  const resolvedAt_m3 = subDays(new Date(), 30)
  const inst_m3 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00007',
      unitId: m3.id,
      debtEntryId: de_m3.id,
      leaseholderName: 'Marcus Webb',
      propertyAddress: 'Flat 3, The Maltings, 25 Old Brewery Road, London, SE1 4CD',
      principalAmount: 1500,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 500),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.RESOLVED,
      resolvedAt: resolvedAt_m3,
      resolvedAmount: 1500,
      createdAt: createdAt_m3,
      updatedAt: resolvedAt_m3,
    },
  })

  // 8. Victoria Flat 1: DEMAND_LETTER, 5 days ago
  const createdAt_v1 = subDays(new Date(), 5)
  const inst_v1 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00008',
      unitId: v1.id,
      debtEntryId: de_v1.id,
      leaseholderName: 'Sophie Clarke',
      propertyAddress: 'Flat 1, Victoria House, 88 Victoria Street, London, SW1 3EF',
      principalAmount: 800,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 180),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.DEMAND_LETTER,
      createdAt: createdAt_v1,
      updatedAt: createdAt_v1,
    },
  })

  // 9. Victoria Flat 2: LETTER_BEFORE_ACTION, DISPUTED, 30 days ago
  const createdAt_v2 = subDays(new Date(), 30)
  const inst_v2 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00009',
      unitId: v2.id,
      debtEntryId: de_v2.id,
      leaseholderName: 'Michael Hughes',
      propertyAddress: 'Flat 2, Victoria House, 88 Victoria Street, London, SW1 3EF',
      principalAmount: 4200,
      debtType: DebtType.DISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 360),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.LETTER_BEFORE_ACTION,
      createdAt: createdAt_v2,
      updatedAt: createdAt_v2,
    },
  })

  // 10. Park View Apt 1: CHASER, 55 days ago
  const createdAt_pv1 = subDays(new Date(), 55)
  const inst_pv1 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00010',
      unitId: pv1.id,
      debtEntryId: de_pv1.id,
      leaseholderName: 'Priya Sharma',
      propertyAddress: 'Apt 1, Park View Apartments, 3 Parkside Drive, London, N1 5GH',
      principalAmount: 1100,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 365),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.CHASER,
      createdAt: createdAt_pv1,
      updatedAt: createdAt_pv1,
    },
  })

  // 11. Park View Apt 2: DRAFT_CLAIM, 85 days ago
  const createdAt_pv2 = subDays(new Date(), 85)
  const inst_pv2 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00011',
      unitId: pv2.id,
      debtEntryId: de_pv2.id,
      leaseholderName: 'Thomas Reid',
      propertyAddress: 'Apt 2, Park View Apartments, 3 Parkside Drive, London, N1 5GH',
      principalAmount: 2800,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 390),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.DRAFT_CLAIM,
      createdAt: createdAt_pv2,
      updatedAt: createdAt_pv2,
    },
  })

  // 12. Park View Apt 3: CLAIM_ISSUED, 110 days ago
  const createdAt_pv3 = subDays(new Date(), 110)
  const inst_pv3 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00012',
      unitId: pv3.id,
      debtEntryId: de_pv3.id,
      leaseholderName: 'Grace Adeyemi',
      propertyAddress: 'Apt 3, Park View Apartments, 3 Parkside Drive, London, N1 5GH',
      principalAmount: 1600,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 410),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.CLAIM_ISSUED,
      createdAt: createdAt_pv3,
      updatedAt: createdAt_pv3,
    },
  })

  // 13. Canal Quarter Unit 1: ENFORCEMENT, 160 days ago
  const createdAt_cq1 = subDays(new Date(), 160)
  const inst_cq1 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00013',
      unitId: cq1.id,
      debtEntryId: de_cq1.id,
      leaseholderName: 'Hassan Al-Rashid',
      propertyAddress: 'Unit 1, Canal Quarter, 55 Towpath Road, London, E14 6IJ',
      principalAmount: 3100,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.GROUND_RENT,
      dueFromDate: subDays(new Date(), 450),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.ENFORCEMENT,
      createdAt: createdAt_cq1,
      updatedAt: createdAt_cq1,
    },
  })

  // 14. Canal Quarter Unit 2: RESOLVED, 190 days ago, resolvedAt 15 days ago
  const createdAt_cq2 = subDays(new Date(), 190)
  const resolvedAt_cq2 = subDays(new Date(), 15)
  const inst_cq2 = await prisma.instruction.create({
    data: {
      firmId: firm.id,
      reference: 'DR-2024-00014',
      unitId: cq2.id,
      debtEntryId: de_cq2.id,
      leaseholderName: 'Fiona McAllister',
      propertyAddress: 'Unit 2, Canal Quarter, 55 Towpath Road, London, E14 6IJ',
      principalAmount: 1900,
      debtType: DebtType.UNDISPUTED,
      debtCategory: DebtCategory.SERVICE_CHARGE,
      dueFromDate: subDays(new Date(), 480),
      interestType: InterestType.STATUTORY,
      currentStage: InstructionStage.RESOLVED,
      resolvedAt: resolvedAt_cq2,
      resolvedAmount: 1900,
      createdAt: createdAt_cq2,
      updatedAt: resolvedAt_cq2,
    },
  })
  console.log('Created 14 instructions')

  // ─── Stage Histories ──────────────────────────────────────────────────────────
  // Stage order: DEMAND_LETTER -> LETTER_BEFORE_ACTION -> CHASER -> DRAFT_CLAIM -> CLAIM_ISSUED -> ENFORCEMENT -> RESOLVED
  const stageOrder: InstructionStage[] = [
    InstructionStage.DEMAND_LETTER,
    InstructionStage.LETTER_BEFORE_ACTION,
    InstructionStage.CHASER,
    InstructionStage.DRAFT_CLAIM,
    InstructionStage.CLAIM_ISSUED,
    InstructionStage.ENFORCEMENT,
    InstructionStage.RESOLVED,
  ]

  async function createStageHistories(
    instructionId: string,
    currentStage: InstructionStage,
    instructionCreatedAt: Date
  ) {
    const targetIndex = stageOrder.indexOf(currentStage)
    let currentDate = instructionCreatedAt

    for (let i = 0; i <= targetIndex; i++) {
      const fromStage = i === 0 ? null : stageOrder[i - 1]
      const toStage = stageOrder[i]

      await prisma.stageHistory.create({
        data: {
          instructionId,
          fromStage: fromStage ?? undefined,
          toStage,
          changedById: sarah.id,
          changedAt: currentDate,
        },
      })

      // Advance date by 14-21 days for next transition
      currentDate = subDays(currentDate, -18) // add 18 days forward
    }
  }

  await createStageHistories(inst_rc1a.id, InstructionStage.DEMAND_LETTER, createdAt_rc1a)
  await createStageHistories(inst_rc1b.id, InstructionStage.LETTER_BEFORE_ACTION, createdAt_rc1b)
  await createStageHistories(inst_rc2a.id, InstructionStage.CHASER, createdAt_rc2a)
  await createStageHistories(inst_rc2b.id, InstructionStage.DRAFT_CLAIM, createdAt_rc2b)
  await createStageHistories(inst_m1.id, InstructionStage.CLAIM_ISSUED, createdAt_m1)
  await createStageHistories(inst_m2.id, InstructionStage.ENFORCEMENT, createdAt_m2)
  await createStageHistories(inst_m3.id, InstructionStage.RESOLVED, createdAt_m3)
  await createStageHistories(inst_v1.id, InstructionStage.DEMAND_LETTER, createdAt_v1)
  await createStageHistories(inst_v2.id, InstructionStage.LETTER_BEFORE_ACTION, createdAt_v2)
  await createStageHistories(inst_pv1.id, InstructionStage.CHASER, createdAt_pv1)
  await createStageHistories(inst_pv2.id, InstructionStage.DRAFT_CLAIM, createdAt_pv2)
  await createStageHistories(inst_pv3.id, InstructionStage.CLAIM_ISSUED, createdAt_pv3)
  await createStageHistories(inst_cq1.id, InstructionStage.ENFORCEMENT, createdAt_cq1)
  await createStageHistories(inst_cq2.id, InstructionStage.RESOLVED, createdAt_cq2)
  console.log('Created stage histories')

  // ─── Legal Costs ──────────────────────────────────────────────────────────────
  // Helper: returns the index of a stage in the stage order
  function stageIndex(stage: InstructionStage): number {
    return stageOrder.indexOf(stage)
  }

  const CHASER_IDX = stageIndex(InstructionStage.CHASER)
  const DRAFT_CLAIM_IDX = stageIndex(InstructionStage.DRAFT_CLAIM)
  const CLAIM_ISSUED_IDX = stageIndex(InstructionStage.CLAIM_ISSUED)
  const ENFORCEMENT_IDX = stageIndex(InstructionStage.ENFORCEMENT)

  interface InstructionMeta {
    id: string
    stage: InstructionStage
    createdAt: Date
    resolvedAt?: Date
  }

  const instructionMetas: InstructionMeta[] = [
    { id: inst_rc1a.id, stage: InstructionStage.DEMAND_LETTER, createdAt: createdAt_rc1a },
    { id: inst_rc1b.id, stage: InstructionStage.LETTER_BEFORE_ACTION, createdAt: createdAt_rc1b },
    { id: inst_rc2a.id, stage: InstructionStage.CHASER, createdAt: createdAt_rc2a },
    { id: inst_rc2b.id, stage: InstructionStage.DRAFT_CLAIM, createdAt: createdAt_rc2b },
    { id: inst_m1.id, stage: InstructionStage.CLAIM_ISSUED, createdAt: createdAt_m1 },
    { id: inst_m2.id, stage: InstructionStage.ENFORCEMENT, createdAt: createdAt_m2 },
    { id: inst_m3.id, stage: InstructionStage.RESOLVED, createdAt: createdAt_m3, resolvedAt: resolvedAt_m3 },
    { id: inst_v1.id, stage: InstructionStage.DEMAND_LETTER, createdAt: createdAt_v1 },
    { id: inst_v2.id, stage: InstructionStage.LETTER_BEFORE_ACTION, createdAt: createdAt_v2 },
    { id: inst_pv1.id, stage: InstructionStage.CHASER, createdAt: createdAt_pv1 },
    { id: inst_pv2.id, stage: InstructionStage.DRAFT_CLAIM, createdAt: createdAt_pv2 },
    { id: inst_pv3.id, stage: InstructionStage.CLAIM_ISSUED, createdAt: createdAt_pv3 },
    { id: inst_cq1.id, stage: InstructionStage.ENFORCEMENT, createdAt: createdAt_cq1 },
    { id: inst_cq2.id, stage: InstructionStage.RESOLVED, createdAt: createdAt_cq2, resolvedAt: resolvedAt_cq2 },
  ]

  for (const meta of instructionMetas) {
    const idx = stageIndex(meta.stage)
    const isResolved = meta.stage === InstructionStage.RESOLVED
    const recovered = isResolved
    const recoveredAt = isResolved ? meta.resolvedAt : undefined

    // CHASER+ costs: fixed_fee £500 (LBA preparation), disbursement £35 (postage)
    if (idx >= CHASER_IDX) {
      const chaserDate = subDays(meta.createdAt, -14)

      await prisma.legalCost.create({
        data: {
          instructionId: meta.id,
          addedById: sarah.id,
          costType: CostType.FIXED_FEE,
          description: 'LBA preparation',
          amount: 500,
          recovered,
          recoveredAt: recoveredAt ?? null,
          incurredAt: chaserDate,
          createdAt: chaserDate,
        },
      })

      await prisma.legalCost.create({
        data: {
          instructionId: meta.id,
          addedById: sarah.id,
          costType: CostType.DISBURSEMENT,
          description: 'Postage and service',
          amount: 35,
          recovered,
          recoveredAt: recoveredAt ?? null,
          incurredAt: chaserDate,
          createdAt: chaserDate,
        },
      })
    }

    // DRAFT_CLAIM+ costs: fixed_fee £750 (claim preparation)
    if (idx >= DRAFT_CLAIM_IDX) {
      const draftDate = subDays(meta.createdAt, -32)

      await prisma.legalCost.create({
        data: {
          instructionId: meta.id,
          addedById: sarah.id,
          costType: CostType.FIXED_FEE,
          description: 'Claim preparation',
          amount: 750,
          recovered,
          recoveredAt: recoveredAt ?? null,
          incurredAt: draftDate,
          createdAt: draftDate,
        },
      })
    }

    // CLAIM_ISSUED+ costs: court_fee £205
    if (idx >= CLAIM_ISSUED_IDX) {
      const claimDate = subDays(meta.createdAt, -50)

      await prisma.legalCost.create({
        data: {
          instructionId: meta.id,
          addedById: sarah.id,
          costType: CostType.COURT_FEE,
          description: 'Court issue fee',
          amount: 205,
          recovered,
          recoveredAt: recoveredAt ?? null,
          incurredAt: claimDate,
          createdAt: claimDate,
        },
      })
    }

    // ENFORCEMENT+ costs: hourly £400 (enforcement work)
    if (idx >= ENFORCEMENT_IDX) {
      const enforcementDate = subDays(meta.createdAt, -68)

      await prisma.legalCost.create({
        data: {
          instructionId: meta.id,
          addedById: sarah.id,
          costType: CostType.HOURLY,
          description: 'Enforcement work',
          amount: 400,
          recovered,
          recoveredAt: recoveredAt ?? null,
          incurredAt: enforcementDate,
          createdAt: enforcementDate,
        },
      })
    }
  }
  console.log('Created legal costs')

  console.log('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
