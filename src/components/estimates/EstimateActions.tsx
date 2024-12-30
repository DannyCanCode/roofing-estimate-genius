import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit, CheckCircle, Trash2 } from "lucide-react";

export const EstimateActions: FC = () => {
  return (
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
  );
};