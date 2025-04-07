export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  barcodes?: string[];
  serialized: boolean;
}
