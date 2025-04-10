'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Transfer } from '@/types/transfer';
import { formatDate } from '@/app/utils/dateUtils';

interface TransfersTableProps {
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Sanitize transfer data to ensure only primitive values are used
const sanitizeTransfer = (transfer: Transfer) => {
  return {
    id: String(transfer.id),
    referenceNumber: transfer.referenceNumber || 'N/A',
    sourceWarehouse: transfer.sourceWarehouse || 'Unknown',
    destinationWarehouse: transfer.destinationWarehouse || 'Unknown',
    status: transfer.status || 'Unknown',
    createdAt: transfer.createdAt || '',
    stocks: undefined as undefined // Explicitly type stocks as undefined
  };
};

const TransfersTable: React.FC<TransfersTableProps> = ({
  transfers,
  loading,
  error,
  page,
  totalPages,
  onPageChange
}) => {
  // Memoize status color to prevent unnecessary re-renders
  const getStatusColor = useCallback((status?: string | null) => {
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }

    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Memoize sanitized transfers to ensure consistent rendering
  const sanitizedTransfers = useMemo(() => 
    transfers.map(sanitizeTransfer), 
    [transfers]
  );

  // Prevent hydration mismatches by using client-side rendering
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  if (loading) {
    return <div className="text-center py-4">Loading transfers...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (sanitizedTransfers.length === 0) {
    return <div className="text-center py-4">No transfers found</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Reference Number</th>
              <th className="px-4 py-2 text-left">Source Warehouse</th>
              <th className="px-4 py-2 text-left">Destination Warehouse</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {sanitizedTransfers.map((transfer) => (
              <tr 
                key={transfer.id} 
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-2">{transfer.referenceNumber}</td>
                <td className="px-4 py-2">{transfer.sourceWarehouse}</td>
                <td className="px-4 py-2">{transfer.destinationWarehouse}</td>
                <td className="px-4 py-2">
                  {/* Use client-side formatting to prevent hydration mismatches */}
                  {formatDate(transfer.createdAt || '')}
                </td>
                <td className="px-4 py-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transfer.status)}`}
                  >
                    {transfer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page + 1} of {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages - 1}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TransfersTable;
