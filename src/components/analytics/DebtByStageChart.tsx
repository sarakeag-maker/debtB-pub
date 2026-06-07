'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatStageLabel } from '@/lib/utils'

interface DebtByStageChartProps {
  data: { stage: string; amount: number }[]
}

const STAGE_COLORS: Record<string, string> = {
  DEMAND_LETTER: '#3b82f6',
  LETTER_BEFORE_ACTION: '#f59e0b',
  CHASER: '#f97316',
  DRAFT_CLAIM: '#8b5cf6',
  CLAIM_ISSUED: '#ef4444',
  ENFORCEMENT: '#f43f5e',
  RESOLVED: '#22c55e',
}

function CurrencyTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  if (x === undefined || y === undefined || !payload) return null
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#6b7280" fontSize={11}>
        {formatCurrency(payload.value)}
      </text>
    </g>
  )
}

function StageTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (x === undefined || y === undefined || !payload) return null
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-4} y={0} dy={4} textAnchor="end" fill="#6b7280" fontSize={11}>
        {formatStageLabel(payload.value)}
      </text>
    </g>
  )
}

export function DebtByStageChart({ data }: DebtByStageChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 140, bottom: 4 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(v) => formatCurrency(v)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={StageTick as any}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Outstanding']}
          labelFormatter={(label: string) => formatStageLabel(label)}
          contentStyle={{
            fontSize: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
          }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.stage}
              fill={STAGE_COLORS[entry.stage] ?? '#6b7280'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
