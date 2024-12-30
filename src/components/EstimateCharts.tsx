import { StatusDistributionChart } from "./charts/StatusDistributionChart";
import { MonthlyEstimatesChart } from "./charts/MonthlyEstimatesChart";

const emptyStatusData = [
  { name: "Pending", value: 0 },
  { name: "Approved", value: 0 },
];

const emptyMonthlyData = [
  { name: "Jan", estimates: 0 },
  { name: "Feb", estimates: 0 },
  { name: "Mar", estimates: 0 },
  { name: "Apr", estimates: 0 },
  { name: "May", estimates: 0 },
];

const COLORS = ["#fbbf24", "#22c55e"];

const chartConfig = {
  estimates: {
    label: "Estimates",
    color: "#3b82f6",
  },
  pending: {
    label: "Pending",
    color: "#fbbf24",
  },
  approved: {
    label: "Approved",
    color: "#22c55e",
  },
};

interface EstimateChartsProps {
  isLoading?: boolean;
}

export function EstimateCharts({ isLoading = false }: EstimateChartsProps) {
  return (
    <>
      <StatusDistributionChart
        isLoading={isLoading}
        data={emptyStatusData}
        colors={COLORS}
        config={chartConfig}
      />
      <MonthlyEstimatesChart
        isLoading={isLoading}
        data={emptyMonthlyData}
        config={chartConfig}
      />
    </>
  );
}