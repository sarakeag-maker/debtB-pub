import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

/**
 * Merges Tailwind CSS class names, resolving conflicts with tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as GBP currency.
 * e.g. 1234.5 → "£1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

/**
 * Formats a date as "14 Jan 2024".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy')
}

/**
 * Formats a date as "14/01/2024".
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy')
}

/**
 * Returns Tailwind background + text colour class pair for a given instruction stage.
 */
export function stageColor(stage: string): string {
  const map: Record<string, string> = {
    DEMAND_LETTER: 'bg-blue-100 text-blue-800',
    LETTER_BEFORE_ACTION: 'bg-yellow-100 text-yellow-800',
    CHASER: 'bg-orange-100 text-orange-800',
    DRAFT_CLAIM: 'bg-purple-100 text-purple-800',
    CLAIM_ISSUED: 'bg-red-100 text-red-800',
    ENFORCEMENT: 'bg-rose-100 text-rose-800',
    RESOLVED: 'bg-green-100 text-green-800',
  }
  return map[stage] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Converts an InstructionStage enum value to a human-readable label.
 * e.g. DEMAND_LETTER → "Demand Letter"
 */
export function formatStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    DEMAND_LETTER: 'Demand Letter',
    LETTER_BEFORE_ACTION: 'Letter Before Action',
    CHASER: 'Chaser',
    DRAFT_CLAIM: 'Draft Claim',
    CLAIM_ISSUED: 'Claim Issued',
    ENFORCEMENT: 'Enforcement',
    RESOLVED: 'Resolved',
  }
  return labels[stage] ?? stage
}

/**
 * Returns Tailwind background + text colour class pair for a given debt type.
 */
export function debtTypeColor(type: string): string {
  const map: Record<string, string> = {
    UNDISPUTED: 'bg-teal-100 text-teal-800',
    DISPUTED: 'bg-amber-100 text-amber-800',
  }
  return map[type] ?? 'bg-gray-100 text-gray-800'
}
