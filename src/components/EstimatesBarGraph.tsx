import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Jan', estimates: 45 },
  { month: 'Feb', estimates: 52 },
  { month: 'Mar', estimates: 48 },
  { month: 'Apr', estimates: 61 },
  { month: 'May', estimates: 55 },
  { month: 'Jun', estimates: 67 },
  { month: 'Jul', estimates: 63 },
  { month: 'Aug', estimates: 58 },
  { month: 'Sep', estimates: 65 },
  { month: 'Oct', estimates: 71 },
  { month: 'Nov', estimates: 68 },
  { month: 'Dec', estimates: 72 }
]

export function EstimatesBarGraph() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="estimates" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 