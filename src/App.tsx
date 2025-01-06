import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PDFUploader } from './components/PDFUploader'
import { Card } from "@/components/ui/card"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold text-gray-900">Roofing Estimate Genius</h1>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Estimate Status Distribution</h2>
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No estimates available yet
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Monthly Estimates</h2>
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No data available yet
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Estimates</h2>
                  <select className="border rounded p-1">
                    <option>All Status</option>
                  </select>
                </div>
                <div className="text-gray-500 text-center py-4">
                  No estimates available yet
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-6">
                <PDFUploader />
              </div>
            </div>
          </main>

          <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © 2024 Roofing Estimate Genius. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  )
}