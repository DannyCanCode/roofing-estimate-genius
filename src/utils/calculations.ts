export function calculateWasteSquares(totalSquares: number, wasteFactor: number): number {
  return totalSquares * (1 + wasteFactor);
}

export function calculateLinearFootage(length: number, count: number): number {
  return length * count;
}

export function calculateTotalCost(materialCosts: number, laborCosts: number): number {
  return materialCosts + laborCosts;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
} 