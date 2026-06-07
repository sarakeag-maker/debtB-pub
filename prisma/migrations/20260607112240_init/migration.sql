-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SOLICITOR', 'CLIENT', 'MANAGING_AGENT');

-- CreateEnum
CREATE TYPE "InstructionStage" AS ENUM ('DEMAND_LETTER', 'LETTER_BEFORE_ACTION', 'CHASER', 'DRAFT_CLAIM', 'CLAIM_ISSUED', 'ENFORCEMENT', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('UNDISPUTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DebtCategory" AS ENUM ('SERVICE_CHARGE', 'GROUND_RENT', 'ADMINISTRATION_CHARGE', 'INSURANCE_CONTRIBUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('CONTRACTUAL', 'STATUTORY');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('FIXED_FEE', 'HOURLY', 'DISBURSEMENT', 'COURT_FEE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firmId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT NOT NULL,
    "buildingName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAgent" (
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyAgent_pkey" PRIMARY KEY ("propertyId","userId")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "flatRef" TEXT NOT NULL,
    "leaseholderName" TEXT NOT NULL,
    "leaseholderEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtEntry" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "DebtCategory" NOT NULL,
    "dueFromDate" TIMESTAMP(3) NOT NULL,
    "dueToDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DebtEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instruction" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "debtEntryId" TEXT,
    "leaseholderName" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "debtType" "DebtType" NOT NULL DEFAULT 'UNDISPUTED',
    "debtCategory" "DebtCategory" NOT NULL,
    "dueFromDate" TIMESTAMP(3) NOT NULL,
    "interestType" "InterestType" NOT NULL DEFAULT 'STATUTORY',
    "contractualRate" DECIMAL(6,4),
    "currentStage" "InstructionStage" NOT NULL DEFAULT 'DEMAND_LETTER',
    "resolvedAt" TIMESTAMP(3),
    "resolvedAmount" DECIMAL(12,2),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "instructionId" TEXT NOT NULL,
    "fromStage" "InstructionStage",
    "toStage" "InstructionStage" NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCost" (
    "id" TEXT NOT NULL,
    "instructionId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "costType" "CostType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recoveredAt" TIMESTAMP(3),
    "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedLetter" (
    "id" TEXT NOT NULL,
    "instructionId" TEXT NOT NULL,
    "stage" "InstructionStage" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageUrl" TEXT,
    "fileData" BYTEA,

    CONSTRAINT "GeneratedLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Property_firmId_idx" ON "Property"("firmId");

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_flatRef_key" ON "Unit"("propertyId", "flatRef");

-- CreateIndex
CREATE INDEX "ImportBatch_uploadedById_idx" ON "ImportBatch"("uploadedById");

-- CreateIndex
CREATE INDEX "DebtEntry_unitId_idx" ON "DebtEntry"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Instruction_reference_key" ON "Instruction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Instruction_debtEntryId_key" ON "Instruction"("debtEntryId");

-- CreateIndex
CREATE INDEX "Instruction_firmId_idx" ON "Instruction"("firmId");

-- CreateIndex
CREATE INDEX "Instruction_unitId_idx" ON "Instruction"("unitId");

-- CreateIndex
CREATE INDEX "Instruction_currentStage_idx" ON "Instruction"("currentStage");

-- CreateIndex
CREATE INDEX "Instruction_createdAt_idx" ON "Instruction"("createdAt");

-- CreateIndex
CREATE INDEX "StageHistory_instructionId_idx" ON "StageHistory"("instructionId");

-- CreateIndex
CREATE INDEX "LegalCost_instructionId_idx" ON "LegalCost"("instructionId");

-- CreateIndex
CREATE INDEX "GeneratedLetter_instructionId_idx" ON "GeneratedLetter"("instructionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAgent" ADD CONSTRAINT "PropertyAgent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAgent" ADD CONSTRAINT "PropertyAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtEntry" ADD CONSTRAINT "DebtEntry_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtEntry" ADD CONSTRAINT "DebtEntry_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction" ADD CONSTRAINT "Instruction_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction" ADD CONSTRAINT "Instruction_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction" ADD CONSTRAINT "Instruction_debtEntryId_fkey" FOREIGN KEY ("debtEntryId") REFERENCES "DebtEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCost" ADD CONSTRAINT "LegalCost_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCost" ADD CONSTRAINT "LegalCost_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedLetter" ADD CONSTRAINT "GeneratedLetter_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
