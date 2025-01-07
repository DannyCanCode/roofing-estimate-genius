import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EstimateTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

export function EstimateTypeSelector({
  selectedType,
  onTypeSelect
}: EstimateTypeSelectorProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Select Roofing Type</h2>
      <div className="flex gap-4">
        <Button
          variant={selectedType === 'SHINGLE' ? 'default' : 'outline'}
          onClick={() => onTypeSelect('SHINGLE')}
        >
          SHINGLE
        </Button>
        <Button
          variant={selectedType === 'TILE' ? 'default' : 'outline'}
          onClick={() => onTypeSelect('TILE')}
        >
          TILE
        </Button>
        <Button
          variant={selectedType === 'METAL' ? 'default' : 'outline'}
          onClick={() => onTypeSelect('METAL')}
        >
          METAL
        </Button>
      </div>
    </Card>
  );
}