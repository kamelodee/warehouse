import React from 'react';
import { Transfer } from '@/types/transfer';

interface TransferDetailsModalProps {
  transfer: Transfer;
  onClose: () => void;
}

const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({ transfer, onClose }) => {
  const renderStockItem = (stock: Transfer['stocks'][0]) => (
    <tr key={`${stock.id.transferId}-${stock.id.productId}`} className="border-b hover:bg-gray-50 text-gray-900">
      <td className="py-2 px-4">{stock.product.name}</td>
      <td className="py-2 px-4">{stock.product.code}</td>
      <td className="py-2 px-4">{stock.quantity}</td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Transfer Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-900 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Information</h3>
              <div className="space-y-2">
                <p><strong className="text-gray-900">Number:</strong> {transfer.number}</p>
                <p><strong className="text-gray-900">Type:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    transfer.type.toLowerCase() === 'completed' ? 'bg-green-200 text-green-800' :
                    transfer.type.toLowerCase() === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {transfer.type}
                  </span>
                </p>
                <p><strong className="text-gray-900">Date:</strong> {transfer.date}</p>
                <p><strong className="text-gray-900">Description:</strong> {transfer.description || 'No description'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Details</h3>
              <div className="space-y-2">
                <div>
                  <strong className="text-gray-900">Source Warehouse:</strong>
                  <p>{transfer.sourceWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-900">{transfer.sourceWarehouse?.location || 'No location details'}</p>
                </div>
                <div>
                  <strong className="text-gray-900">Destination Warehouse:</strong>
                  <p>{transfer.destinationWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-900">{transfer.destinationWarehouse?.location || 'No location details'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4">Product Name</th>
                    <th className="py-2 px-4">Product Code</th>
                    <th className="py-2 px-4">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.stocks.map(renderStockItem)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailsModal;
