import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProcessingIndicatorProps {
  isLoading: boolean;
  status: string;
}

export function ProcessingIndicator({ isLoading, status }: ProcessingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>{status}</span>
      </div>
    </Card>
  );
}