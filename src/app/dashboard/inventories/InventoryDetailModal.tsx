import React from 'react';
import { 
  MdClose, 
  MdInventory, 
  MdWarehouse, 
  MdCategory, 
  MdBarcodeReader, 
  MdCalendarToday, 
  MdShoppingCart,
  MdLocalShipping
} from 'react-icons/md';
import { InventoryItem } from '@/app/api/inventoryService';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  isOpen: boolean;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ 
  item, 
  onClose, 
  isOpen 
}) => {
  if (!isOpen || !item) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-200 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-200 text-green-900';
      case 'pending':
        return 'bg-yellow-200 text-yellow-900';
      case 'sold':
        return 'bg-blue-200 text-blue-900';
      case 'damaged':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-100 to-blue-100">
          <div className="flex items-center">
            <MdInventory className="mr-4 text-3xl text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Inventory Item Details</h2>
          </div>
          <button 
            className="text-gray-600 hover:text-gray-900 hover:bg-red-100 p-2 rounded-full transition-all duration-200" 
            onClick={onClose}
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-4">
              <MdShoppingCart className="mr-3 text-indigo-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">ID:</span>
                <span className="text-gray-900 font-semibold">{item.id}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">Quantity:</span>
                <span className="text-green-600 font-bold">{item.quantity}</span>
              </div>
              {item.status && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-24">Status:</span>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
              )}
              {item.serialNumber && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-24">Serial Number:</span>
                  <span className="text-gray-900 font-semibold">{item.serialNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-4">
              <MdCategory className="mr-3 text-green-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">Product Name:</span>
                <span className="text-gray-900 font-semibold">{item.product.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">Product Code:</span>
                <span className="text-gray-900 font-semibold">{item.product.code}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">Category:</span>
                <span className="text-gray-900 font-semibold">{item.product.category}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2 font-medium w-24">Serialized:</span>
                <span className="text-gray-900 font-semibold">{item.product.serialized ? 'Yes' : 'No'}</span>
              </div>
              {item.product.barcodes && item.product.barcodes.length > 0 && (
                <div className="col-span-full">
                  <div className="flex items-center mt-2">
                    <MdBarcodeReader className="mr-2 text-blue-500" />
                    <span className="text-gray-600 mr-2 font-medium">Barcodes:</span>
                    <div className="flex flex-wrap gap-2">
                      {item.product.barcodes.map((barcode, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                        >
                          {barcode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Information */}
          {item.warehouse && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center mb-4">
                <MdWarehouse className="mr-3 text-blue-500 text-xl" />
                <h3 className="text-lg font-semibold text-gray-900">Warehouse Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-32">Warehouse Name:</span>
                  <span className="text-gray-900 font-semibold">{item.warehouse.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-32">Warehouse Code:</span>
                  <span className="text-gray-900 font-semibold">{item.warehouse.code}</span>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-4">
              <MdLocalShipping className="mr-3 text-purple-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.batchNumber && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-32">Batch Number:</span>
                  <span className="text-gray-900 font-semibold">{item.batchNumber}</span>
                </div>
              )}
              {item.containerNumber && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-32">Container Number:</span>
                  <span className="text-gray-900 font-semibold">{item.containerNumber}</span>
                </div>
              )}
              {item.blNumber && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-32">BL Number:</span>
                  <span className="text-gray-900 font-semibold">{item.blNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-4">
              <MdCalendarToday className="mr-3 text-teal-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">Timestamps</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.createdAt && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-24">Created At:</span>
                  <span className="text-gray-900 font-semibold">{formatDate(item.createdAt)}</span>
                </div>
              )}
              {item.updatedAt && (
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2 font-medium w-24">Updated At:</span>
                  <span className="text-gray-900 font-semibold">{formatDate(item.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end bg-gradient-to-r from-indigo-50 to-blue-50">
          <button 
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 flex items-center"
            onClick={onClose}
          >
            <MdClose className="mr-2" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailModal;
