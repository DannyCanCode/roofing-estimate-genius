import { Card } from "@/components/ui/card"
import { PDFUploader } from './components/PDFUploader'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">3MG Roofing Dashboard</h1>
        <p className="text-gray-600 mb-8">Generate and manage roofing estimates</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Estimates</p>
            <h3 className="text-2xl font-bold">$0.00</h3>
            <p className="text-xs text-gray-500">No estimates yet</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending Estimates</p>
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-xs text-gray-500">No pending estimates</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Approved Estimates</p>
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-xs text-gray-500">No approved estimates</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estimate Status Distribution</h3>
            <div className="h-[200px]"></div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Estimates</h3>
            <div className="h-[200px]">
              <div className="w-full h-full flex items-end justify-between">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month) => (
                  <div key={month} className="flex flex-col items-center">
                    <div className="w-12 bg-gray-100 h-32"></div>
                    <span className="text-xs mt-2">{month}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <div className="p-6 flex justify-between items-center border-b">
            <h3 className="text-lg font-semibold">Recent Estimates</h3>
            <select className="border rounded px-2 py-1">
              <option>All Status</option>
            </select>
          </div>
          <div className="p-6 text-center text-gray-500">
            No estimates available yet
          </div>
        </Card>

        <PDFUploader />
      </div>
    </div>
  )
}