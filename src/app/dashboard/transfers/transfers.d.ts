declare module './TransfersTable' {
  import { Transfer } from '@/types/transfer';
  
  interface TransfersTableProps {
    transfers: Transfer[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }

  const TransfersTable: React.FC<TransfersTableProps>;
  export default TransfersTable;
}

declare module './TransfersFilters' {
  import { TransferFilter } from '@/types/transfer';
  
  interface TransfersFiltersProps {
    filters: TransferFilter;
    onFilterChange: (filters: TransferFilter) => void;
  }

  const TransfersFilters: React.FC<TransfersFiltersProps>;
  export default TransfersFilters;
}
