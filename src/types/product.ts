export interface Product {
  id: number;
  name: string;
  code: string;
  category?: string;
  serialized?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
