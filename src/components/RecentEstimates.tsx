import React from 'react'
import { FileText, ArrowRight } from 'lucide-react'

const recentEstimates = [
  {
    id: 1,
    address: '123 Main St, Austin, TX',
    date: '2024-01-09',
    status: 'Approved',
    amount: '$12,450'
  },
  {
    id: 2,
    address: '456 Oak Ave, Austin, TX',
    date: '2024-01-08',
    status: 'Pending',
    amount: '$9,850'
  },
  {
    id: 3,
    address: '789 Pine Rd, Austin, TX',
    date: '2024-01-07',
    status: 'Approved',
    amount: '$15,200'
  }
]

export function RecentEstimates() {
  return (
    <div className="space-y-4">
      {recentEstimates.map((estimate) => (
        <div
          key={estimate.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{estimate.address}</h3>
              <p className="text-sm text-gray-600">{estimate.date}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm font-medium">{estimate.amount}</p>
              <p className="text-sm text-gray-600">{estimate.status}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  )
} 