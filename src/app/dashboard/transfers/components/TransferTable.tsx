import React, { useState } from 'react';
import { Transfer } from '@/types/transfer';
import TransferDetailsModal from './TransferDetailsModal';

interface TransferTableProps {
  transfers: Transfer[];
  totalTransfers: number;
  totalPages: number;
  currentPage: number;
  onRefresh: () => void;
}

const TransferTable: React.FC<TransferTableProps> = ({ 
  transfers, 
  totalTransfers, 
  totalPages, 
  currentPage, 
  onRefresh 
}) => {
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
  };

  const handleCloseDetails = () => {
    setSelectedTransfer(null);
  };

  const renderStatusBadge = (type?: string) => {
    const statusColors: { [key: string]: string } = {
      'completed': 'bg-green-200 text-green-800',
      'pending': 'bg-yellow-200 text-yellow-800',
      'cancelled': 'bg-red-200 text-red-800'
    };

    const safeType = type?.toLowerCase() || 'unknown';
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[safeType] || 'bg-gray-200 text-gray-800'}`}>
        {type || 'Unknown'}
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Transfer Number</th>
              <th className="py-3 px-6 text-left">Type</th>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Source Warehouse</th>
              <th className="py-3 px-6 text-left">Destination Warehouse</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium">{transfer.number || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-6 text-left">
                  {renderStatusBadge(transfer.type)}
                </td>
                <td className="py-3 px-6 text-left">
                  <span>{transfer.date || 'N/A'}</span>
                </td>
                <td className="py-3 px-6 text-left">
                  <span>{transfer.sourceWarehouse?.name || 'Unknown'}</span>
                </td>
                <td className="py-3 px-6 text-left">
                  <span>{transfer.destinationWarehouse?.name || 'Unknown'}</span>
                </td>
                <td className="py-3 px-6 text-left">
                  {renderStatusBadge(transfer.type)}
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button 
                      onClick={() => handleViewDetails(transfer)}
                      className="text-indigo-500 hover:text-indigo-700 focus:outline-none"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No transfers found
          </div>
        )}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Total Transfers: {totalTransfers}
          </div>
          <div>
            Page {currentPage + 1} of {totalPages}
          </div>
        </div>
      </div>

      {selectedTransfer && (
        <TransferDetailsModal 
          transfer={selectedTransfer} 
          onClose={handleCloseDetails} 
        />
      )}
    </>
  );
};

export default TransferTable;
