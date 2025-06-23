export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  emails?: string[];
  status: 'active' | 'inactive';
}

export interface Transfer {
  id: string;
  number: string;
  type: string;
  sourceWarehouse?: Warehouse;
  destinationWarehouse?: Warehouse;
  status: 'PENDING' | 'COMPLETED';
  date: string;
}
