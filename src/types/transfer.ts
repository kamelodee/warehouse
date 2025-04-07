export interface TransferEmail {
  id: number;
  email: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  emails: {
    id: number;
    email: string;
  }[];
}

export interface TransferProductBarcode extends String {}

export interface TransferProduct {
  id: number;
  code: string;
  name: string;
  category: string;
  barcodes: TransferProductBarcode[];
  serialized: boolean;
}

export interface TransferStockId {
  transferId: number;
  productId: number;
}

export interface TransferStock {
  id: {
    transferId: number;
    productId: number;
  };
  quantity: number;
  product: {
    id: number;
    code: string;
    name: string;
    category: string;
    barcodes: string[];
    serialized: boolean;
  };
}

export interface Transfer {
  id: number;
  number: string;
  type: string;
  date: string;
  description: string;
  sourceWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  stocks: TransferStock[];
}

export interface TransferResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  content: Transfer[];
}

export interface CreateTransferPayload {
  number: string;
  type: string;
  date: string;
  description: string;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  stocks: {
    productId: number;
    quantity: number;
  }[];
}
