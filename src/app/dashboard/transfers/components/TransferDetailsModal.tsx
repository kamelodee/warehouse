import React from 'react';
import { Transfer } from '@/types/transfer';
import { 
  FaBoxes, 
  FaWarehouse, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaTruck, 
  FaTimes 
} from 'react-icons/fa';

interface TransferDetailsModalProps {
  transfer: Transfer;
  onClose: () => void;
}

const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({ transfer, onClose }) => {
  const renderStockItem = (stock: Transfer['stocks'][0], index: number) => (
    <tr 
      key={`${stock.id.transferId}-${stock.id.productId}`} 
      className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
        <FaBoxes className="mr-3 text-blue-500" />
        {stock.product.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stock.product.code}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{stock.quantity}</td>
    </tr>
  );

  const getStatusColor = () => {
    switch (transfer.type.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <FaTruck className="mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold">Transfer Details</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-md p-4">
              <div className="flex items-center mb-3">
                <FaClipboardList className="mr-2 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">Transfer Information</h3>
              </div>
              <div className="space-y-2">
                <p className="flex items-center text-sm">
                  <strong className="text-gray-700 mr-2 w-24">Number:</strong> 
                  {transfer.number}
                </p>
                <p className="flex items-center text-sm">
                  <strong className="text-gray-700 mr-2 w-24">Type:</strong> 
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {transfer.type}
                  </span>
                </p>
                <p className="flex items-center text-sm">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  <strong className="text-gray-700 mr-2">Date:</strong> 
                  {transfer.date}
                </p>
                <p className="flex items-center text-sm">
                  <strong className="text-gray-700 mr-2 w-24">Description:</strong> 
                  {transfer.description || 'No description provided'}
                </p>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex items-center mb-3">
                <FaWarehouse className="mr-2 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">Warehouse Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-700 block mb-1 text-sm">Source Warehouse</strong>
                  <p className="font-medium text-gray-900">{transfer.sourceWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{transfer.sourceWarehouse?.location || 'No location details'}</p>
                </div>
                <div>
                  <strong className="text-gray-700 block mb-1 text-sm">Destination Warehouse</strong>
                  <p className="font-medium text-gray-900">{transfer.destinationWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{transfer.destinationWarehouse?.location || 'No location details'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="flex items-center mb-3">
              <FaBoxes className="mr-2 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">Stock Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfer.stocks.length > 0 ? (
                    transfer.stocks.map(renderStockItem)
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No stock items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose} 
            className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 mr-2 hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailsModal;
