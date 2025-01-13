import React from 'react'
import { LayoutDashboard, FileText, Settings } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-white border-r">
      <nav className="p-4 space-y-2">
        <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
          <FileText className="h-5 w-5" />
          <span>Estimates</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </div>
      </nav>
    </div>
  )
} 