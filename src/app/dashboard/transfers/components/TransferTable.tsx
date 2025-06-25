import React, { useState } from 'react';
import { Transfer } from '@/types/transfer';
import TransferDetailsModal from './TransferDetailsModal';
import { FiEye } from 'react-icons/fi';

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
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    const safeType = type?.toLowerCase() || 'unknown';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[safeType] || 'bg-gray-100 text-gray-800'}`}>
        {type || 'Unknown'}
      </span>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Warehouse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Warehouse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfers.length > 0 ? (
              transfers.map((transfer, index) => (
                <tr key={transfer.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderStatusBadge(transfer.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.sourceWarehouse?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.destinationWarehouse?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderStatusBadge(transfer.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleViewDetails(transfer)}
                      className="text-blue-500 hover:text-blue-700 focus:outline-none flex items-center"
                      title="View Details"
                    >
                      <FiEye className="mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No transfers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
