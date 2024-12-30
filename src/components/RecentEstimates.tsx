import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, CheckCircle, Trash2 } from "lucide-react";

const recentEstimates = [
  {
    id: 1,
    customerName: "John Smith",
    amount: 12500.00,
    status: "Pending",
    date: "2024-02-20",
  },
  {
    id: 2,
    customerName: "Sarah Johnson",
    amount: 8750.50,
    status: "Approved",
    date: "2024-02-19",
  },
  // Add more mock data as needed
];

export function RecentEstimates() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Estimates</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentEstimates.map((estimate) => (
              <TableRow key={estimate.id}>
                <TableCell>{estimate.customerName}</TableCell>
                <TableCell>${estimate.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      estimate.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {estimate.status}
                  </span>
                </TableCell>
                <TableCell>{estimate.date}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}