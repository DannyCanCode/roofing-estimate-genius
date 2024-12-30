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
import { Eye, Edit, CheckCircle, Trash2, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const recentEstimates = [
  {
    id: 1,
    customerName: "John Smith",
    amount: 12500.00,
    status: "Pending",
    date: "2024-02-20",
    roofingType: "SHINGLE",
    address: "123 Main St, Austin, TX",
  },
  {
    id: 2,
    customerName: "Sarah Johnson",
    amount: 8750.50,
    status: "Approved",
    date: "2024-02-19",
    roofingType: "METAL",
    address: "456 Oak Ave, Austin, TX",
  },
  {
    id: 3,
    customerName: "Mike Wilson",
    amount: 15200.75,
    status: "Completed",
    date: "2024-02-18",
    roofingType: "TILE",
    address: "789 Pine Rd, Austin, TX",
  },
  {
    id: 4,
    customerName: "Emily Brown",
    amount: 9800.25,
    status: "Rejected",
    date: "2024-02-17",
    roofingType: "SHINGLE",
    address: "321 Cedar Ln, Austin, TX",
  },
];

type Status = "All" | "Pending" | "Approved" | "Completed" | "Rejected";
type SortField = "date" | "amount" | "customerName";

export function RecentEstimates() {
  const [statusFilter, setStatusFilter] = useState<Status>("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAndSortedEstimates = recentEstimates
    .filter((estimate) =>
      statusFilter === "All" ? true : estimate.status === statusFilter
    )
    .sort((a, b) => {
      const multiplier = sortAsc ? 1 : -1;
      if (sortField === "date") {
        return multiplier * (new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      if (sortField === "amount") {
        return multiplier * (b.amount - a.amount);
      }
      return multiplier * a.customerName.localeCompare(b.customerName);
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Estimates</CardTitle>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as Status)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("customerName")}
                  className="flex items-center gap-1"
                >
                  Customer
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("amount")}
                  className="flex items-center gap-1"
                >
                  Amount
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1"
                >
                  Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEstimates.map((estimate) => (
              <TableRow key={estimate.id}>
                <TableCell className="font-medium">
                  {estimate.customerName}
                </TableCell>
                <TableCell>${estimate.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      estimate.status
                    )}`}
                  >
                    {estimate.status}
                  </span>
                </TableCell>
                <TableCell>{estimate.roofingType}</TableCell>
                <TableCell>{estimate.address}</TableCell>
                <TableCell>{estimate.date}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit Estimate">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Mark as Approved"
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                    >
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