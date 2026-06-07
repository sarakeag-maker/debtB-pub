'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { CsvUploader } from '@/components/import/CsvUploader'
import { Alert } from '@/components/ui/Alert'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { ImportResult } from '@/types'

export default function ImportPage() {
  const { data: session } = useSession()
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleImportComplete(r: ImportResult) {
    setResult(r)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Import Debt Data"
        subtitle="Upload a CSV file to bulk-import debt instructions"
      />

      {/* Instructions */}
      <Card title="CSV Format Requirements">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Your CSV file must include the following columns (order does not matter):
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-md overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    Column
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    Required
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  { col: 'property_address', req: true, desc: 'Full address of the property' },
                  { col: 'postcode', req: true, desc: 'UK postcode (e.g. SW1A 1AA)' },
                  { col: 'flat_ref', req: true, desc: 'Unit / flat reference number' },
                  { col: 'leaseholder_name', req: true, desc: 'Full name of the leaseholder' },
                  { col: 'leaseholder_email', req: false, desc: 'Leaseholder email address' },
                  { col: 'principal_amount', req: true, desc: 'Debt amount (numeric, e.g. 1250.00)' },
                  { col: 'debt_category', req: true, desc: 'SERVICE_CHARGE | GROUND_RENT | ADMINISTRATION_CHARGE | INSURANCE_CONTRIBUTION | OTHER' },
                  { col: 'due_from_date', req: true, desc: 'Date debt became due (YYYY-MM-DD)' },
                  { col: 'debt_type', req: false, desc: 'UNDISPUTED (default) or DISPUTED' },
                  { col: 'interest_type', req: false, desc: 'STATUTORY (default) or CONTRACTUAL' },
                  { col: 'contractual_rate', req: false, desc: 'Annual rate as decimal (e.g. 0.08 for 8%). Required if interest_type=CONTRACTUAL' },
                ].map(({ col, req, desc }) => (
                  <tr key={col}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800">{col}</td>
                    <td className="px-4 py-2 text-center">
                      {req ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Uploader */}
      <Card title="Upload File">
        <CsvUploader onImportComplete={handleImportComplete} />
      </Card>

      {/* Results */}
      {result && (
        <Card title="Import Results">
          <div className="space-y-3">
            <Alert
              type={result.errors.length === 0 ? 'success' : 'warning'}
              message={
                result.errors.length === 0
                  ? `Successfully imported ${result.processed} instruction${result.processed !== 1 ? 's' : ''}.`
                  : `Imported ${result.processed} rows with ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}.`
              }
            />

            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                <ul className="space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Row {err.row}:</span> {err.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">Batch ID: {result.batchId}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
