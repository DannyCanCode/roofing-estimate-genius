import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const statusData = [
  { name: "Pending", value: 12 },
  { name: "Approved", value: 24 },
];

const monthlyData = [
  { name: "Jan", estimates: 15 },
  { name: "Feb", estimates: 20 },
  { name: "Mar", estimates: 25 },
  { name: "Apr", estimates: 18 },
  { name: "May", estimates: 22 },
];

const COLORS = ["#fbbf24", "#22c55e"];

export function EstimateCharts() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estimate Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}
              </Pie>
              <ChartTooltip>
                <ChartTooltipContent />
              </ChartTooltip>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px]">
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="estimates" fill="#3b82f6" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}