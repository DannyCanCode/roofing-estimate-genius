import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RoofingCategory = "SHINGLE" | "TILE" | "METAL";

interface RoofingCategorySelectorProps {
  selectedCategory: RoofingCategory | null;
  onSelectCategory: (category: RoofingCategory) => void;
}

export function RoofingCategorySelector({
  selectedCategory,
  onSelectCategory,
}: RoofingCategorySelectorProps) {
  const categories: RoofingCategory[] = ["SHINGLE", "TILE", "METAL"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Roofing Type</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className={cn(
              "h-24 text-lg font-semibold",
              selectedCategory === category && "ring-2 ring-primary"
            )}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}