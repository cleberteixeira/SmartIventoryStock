export interface ProductDTO {
  id: string;
  sku: string;
  name: string;
  category: 'FOOD' | 'ELECTRONICS' | 'OFFICE' | 'CLEANING';
  unitMeasure: 'UN' | 'KG' | 'L' | 'CX';
  minStock: number;
  status: string;
}

export interface StockMovementDTO {
  productId: string;
  quantity: number;
  type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';
  batchNumber?: string;
  serialNumber?: string;
  reason: string;
}