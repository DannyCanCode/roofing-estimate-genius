import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstimatesTable } from "./estimates/EstimatesTable";

// Start with empty array instead of example data
const recentEstimates: {
  id: number;
  customerName: string;
  amount: number;
  status: string;
  date: string;
  roofingType: string;
  address: string;
}[] = [];

type Status = "All" | "Pending" | "Approved" | "Completed" | "Rejected";
type SortField = "date" | "amount" | "customerName";

export function RecentEstimates() {
  const [statusFilter, setStatusFilter] = useState<Status>("All");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredAndSortedEstimates = recentEstimates
    .filter((estimate) =>
      statusFilter === "All" ? true : estimate.status === statusFilter
    )
    .sort((a, b) => {
      const multiplier = sortAsc ? 1 : -1;
      if (sortField === "date") {
        return (
          multiplier * (new Date(b.date).getTime() - new Date(a.date).getTime())
        );
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
        <EstimatesTable
          estimates={filteredAndSortedEstimates}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
        />
      </CardContent>
    </Card>
  );
}