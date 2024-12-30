import { FC } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { EstimateStatusBadge } from "./EstimateStatusBadge";
import { EstimateActions } from "./EstimateActions";

type SortField = "date" | "amount" | "customerName";

interface Estimate {
  id: number;
  customerName: string;
  amount: number;
  status: string;
  date: string;
  roofingType: string;
  address: string;
}

interface EstimatesTableProps {
  estimates: Estimate[];
  sortField: SortField;
  sortAsc: boolean;
  onSort: (field: SortField) => void;
}

export const EstimatesTable: FC<EstimatesTableProps> = ({
  estimates,
  sortField,
  sortAsc,
  onSort,
}) => {
  if (estimates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No estimates available yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort("customerName")}
              className="flex items-center gap-1"
            >
              Customer
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              onClick={() => onSort("amount")}
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
              onClick={() => onSort("date")}
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
        {estimates.map((estimate) => (
          <TableRow key={estimate.id}>
            <TableCell className="font-medium">{estimate.customerName}</TableCell>
            <TableCell>${estimate.amount.toFixed(2)}</TableCell>
            <TableCell>
              <EstimateStatusBadge status={estimate.status} />
            </TableCell>
            <TableCell>{estimate.roofingType}</TableCell>
            <TableCell>{estimate.address}</TableCell>
            <TableCell>{estimate.date}</TableCell>
            <TableCell className="text-right">
              <EstimateActions />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};