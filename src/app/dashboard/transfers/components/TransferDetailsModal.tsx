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
  const renderStockItem = (stock: Transfer['stocks'][0]) => (
    <tr 
      key={`${stock.id.transferId}-${stock.id.productId}`} 
      className="border-b hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all duration-200 text-gray-800"
    >
      <td className="py-3 px-4 flex items-center">
        <FaBoxes className="mr-3 text-indigo-500" />
        {stock.product.name}
      </td>
      <td className="py-3 px-4">{stock.product.code}</td>
      <td className="py-3 px-4 font-semibold text-green-600">{stock.quantity}</td>
    </tr>
  );

  const getStatusColor = () => {
    switch (transfer.type.toLowerCase()) {
      case 'completed':
        return 'bg-gradient-to-r from-green-200 to-green-300 text-green-900';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-900';
      default:
        return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-100 to-blue-100">
          <div className="flex items-center">
            <FaTruck className="mr-4 text-3xl text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Transfer Details</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900 hover:bg-red-100 p-2 rounded-full transition-all duration-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center mb-4">
                <FaClipboardList className="mr-3 text-indigo-500 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Transfer Information</h3>
              </div>
              <div className="space-y-3">
                <p className="flex items-center">
                  <strong className="text-gray-700 mr-2 w-24">Number:</strong> 
                  {transfer.number}
                </p>
                <p className="flex items-center">
                  <strong className="text-gray-700 mr-2 w-24">Type:</strong> 
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
                    {transfer.type}
                  </span>
                </p>
                <p className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-indigo-500" />
                  <strong className="text-gray-700 mr-2">Date:</strong> 
                  {transfer.date}
                </p>
                <p className="flex items-center">
                  <strong className="text-gray-700 mr-2 w-24">Description:</strong> 
                  {transfer.description || 'No description provided'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center mb-4">
                <FaWarehouse className="mr-3 text-green-500 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Warehouse Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <strong className="text-gray-700 block mb-1">Source Warehouse</strong>
                  <p className="font-semibold text-gray-900">{transfer.sourceWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{transfer.sourceWarehouse?.location || 'No location details'}</p>
                </div>
                <div>
                  <strong className="text-gray-700 block mb-1">Destination Warehouse</strong>
                  <p className="font-semibold text-gray-900">{transfer.destinationWarehouse?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{transfer.destinationWarehouse?.location || 'No location details'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-4">
              <FaBoxes className="mr-3 text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Stock Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse rounded-lg">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-100 to-blue-100">
                    <th className="py-3 px-4 font-semibold text-gray-800">Product Name</th>
                    <th className="py-3 px-4 font-semibold text-gray-800">Product Code</th>
                    <th className="py-3 px-4 font-semibold text-gray-800">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.stocks.map(renderStockItem)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end bg-gradient-to-r from-indigo-50 to-blue-50">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 flex items-center"
          >
            <FaTimes className="mr-2" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailsModal;
