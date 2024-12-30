import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface EstimateChartsProps {
  isLoading?: boolean;
}

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

export function EstimateCharts({ isLoading = false }: EstimateChartsProps) {
  if (isLoading) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Estimate Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="w-[300px] h-[300px] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Skeleton className="w-full h-full" />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estimate Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emptyStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {emptyStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={emptyMonthlyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="estimates" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}