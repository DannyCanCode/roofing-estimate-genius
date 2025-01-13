import React from 'react'
import { FileText, DollarSign, Clock, TrendingUp } from 'lucide-react'

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Estimates"
        value="156"
        icon={<FileText className="h-5 w-5" />}
        trend="+12% from last month"
      />
      <MetricCard
        title="Average Value"
        value="$12,450"
        icon={<DollarSign className="h-5 w-5" />}
        trend="+5% from last month"
      />
      <MetricCard
        title="Processing Time"
        value="2.5 min"
        icon={<Clock className="h-5 w-5" />}
        trend="-30% from last month"
      />
      <MetricCard
        title="Conversion Rate"
        value="68%"
        icon={<TrendingUp className="h-5 w-5" />}
        trend="+8% from last month"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend: string
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="text-gray-600">{icon}</div>
        <div className="text-sm text-green-600">{trend}</div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
} 