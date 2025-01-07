import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PDFUploader } from './components/PDFUploader';
import { DashboardMetrics } from './components/DashboardMetrics';
import { EstimateCharts } from './components/EstimateCharts';
import { getEstimates } from './services/estimateService';

export default function App() {
  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: getEstimates
  });

  const totalAmount = estimates?.reduce((sum, est) => sum + Number(est.amount), 0) || 0;
  const pendingCount = estimates?.filter(est => est.status === 'pending').length || 0;
  const approvedCount = estimates?.filter(est => est.status === 'approved').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">3MG Roofing Dashboard</h1>
        <p className="text-gray-600 mb-8">Generate and manage roofing estimates</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-gray-600">Total Estimates</p>
            <h3 className="text-2xl font-bold">${totalAmount.toFixed(2)}</h3>
            <p className="text-xs text-gray-500">
              {estimates?.length || 0} total estimates
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Pending Estimates</p>
            <h3 className="text-2xl font-bold">{pendingCount}</h3>
            <p className="text-xs text-gray-500">Awaiting approval</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-600">Approved Estimates</p>
            <h3 className="text-2xl font-bold">{approvedCount}</h3>
            <p className="text-xs text-gray-500">Ready for work</p>
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
          <div className="p-6">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading estimates...</div>
            ) : estimates?.length === 0 ? (
              <div className="text-center text-gray-500">No estimates available yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates?.map((estimate) => (
                    <tr key={estimate.id} className="border-t">
                      <td className="py-2">{estimate.customer_name}</td>
                      <td className="py-2">${Number(estimate.amount).toFixed(2)}</td>
                      <td className="py-2">{estimate.status}</td>
                      <td className="py-2">{new Date(estimate.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <PDFUploader />
      </div>
    </div>
  );
}