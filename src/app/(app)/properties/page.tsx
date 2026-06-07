import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { calculateInterest } from '@/lib/interest'
import { PropertiesClientActions } from './PropertiesClientActions'
import { InstructionStage } from '@prisma/client'
import { Building2 } from 'lucide-react'

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const firmId = session.user.firmId
  const role = session.user.role

  const properties = await prisma.property.findMany({
    where: { firmId },
    include: {
      _count: { select: { units: true } },
      units: {
        include: {
          instructions: {
            where: { deletedAt: null },
            select: {
              id: true,
              currentStage: true,
              principalAmount: true,
              dueFromDate: true,
              interestType: true,
              contractualRate: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = properties.map((prop) => {
    const allInstructions = prop.units.flatMap((u) => u.instructions)
    const activeInstructions = allInstructions.filter(
      (i) => i.currentStage !== InstructionStage.RESOLVED
    )

    const totalDebt = allInstructions.reduce((sum, inst) => {
      const result = calculateInterest({
        principalAmount: Number(inst.principalAmount),
        dueFromDate: inst.dueFromDate,
        interestType: inst.interestType as 'STATUTORY' | 'CONTRACTUAL',
        contractualRate: inst.contractualRate ? Number(inst.contractualRate) : null,
      })
      return sum + result.total
    }, 0)

    return {
      id: prop.id,
      buildingName: prop.buildingName,
      addressLine1: prop.addressLine1,
      addressLine2: prop.addressLine2,
      city: prop.city,
      postcode: prop.postcode,
      unitCount: prop._count.units,
      activeInstructionCount: activeInstructions.length,
      totalDebt,
    }
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        subtitle={`${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'} in portfolio`}
        actions={
          role === 'SOLICITOR' ? (
            <PropertiesClientActions firmId={firmId} />
          ) : null
        }
      />

      <Card>
        {rows.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No properties found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: 'Building / Address', align: 'left' },
                    { label: 'Postcode', align: 'left' },
                    { label: 'Units', align: 'right' },
                    { label: 'Active Instructions', align: 'right' },
                    { label: 'Total Debt (incl. interest)', align: 'right' },
                  ].map(({ label, align }) => (
                    <th
                      key={label}
                      scope="col"
                      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {row.buildingName ?? row.addressLine1}
                      </p>
                      {row.buildingName && (
                        <p className="text-xs text-gray-500">{row.addressLine1}</p>
                      )}
                      {row.city && <p className="text-xs text-gray-500">{row.city}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {row.postcode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                      {row.unitCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                      {row.activeInstructionCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {row.activeInstructionCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {row.totalDebt > 0 ? formatCurrency(row.totalDebt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
