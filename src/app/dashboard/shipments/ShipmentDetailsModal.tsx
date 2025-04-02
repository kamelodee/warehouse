import React from 'react';
import { FaTruck, FaCheckCircle, FaClipboardList, FaBox } from 'react-icons/fa';
import { ProductSerialNumber } from '../../api/shipmentService';

interface ShipmentDetailsModalProps {
  id: number;
  referenceNumber: string;
  type: string;
  status?: string;
  driverName: string;
  notes?: string;
  vehicle?: {
    id: number;
    code: string;
    identificationNumber?: string | null;
  };
  sourceWarehouse?: {
    id: number;
    code: string;
    name: string;
    location: string;
  };
  destinationWarehouse?: {
    id: number;
    code: string;
    name: string;
    location: string;
  };
  stocks: Array<{
    quantity: number;
    quantityReceived: number;
    productId: number;
    productSerialNumbers: ProductSerialNumber[];
    productSerialNumbersReceived: ProductSerialNumber[];
  }>;
  onClose: () => void;
}

const getStatusBadgeColor = (status?: string | null) => {
  if (!status) return 'text-gray-600';

  switch (status.toUpperCase()) {
    case 'DELIVERED':
      return 'text-green-600';
    case 'IN_TRANSIT':
      return 'text-yellow-600';
    case 'PENDING':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ 
  id, 
  referenceNumber, 
  type, 
  status, 
  driverName, 
  notes, 
  vehicle, 
  sourceWarehouse, 
  destinationWarehouse, 
  stocks, 
  onClose 
}) => {
  const renderStocksTable = () => {
    return (
      <table className="w-full border-collapse text-black text-xs">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1 text-left">Product ID</th>
            <th className="border p-1 text-left">Quantity</th>
            <th className="border p-1 text-left">Quantity Received</th>
            <th className="border p-1 text-left">Serial Numbers</th>
            <th className="border p-1 text-left">Serial Numbers Received</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index} className="border-b">
              <td className="border p-1">{stock.productId}</td>
              <td className="border p-1">{stock.quantity}</td>
              <td className="border p-1">{stock.quantityReceived}</td>
              <td className="border p-1">
                {stock.productSerialNumbers.length > 0
                  ? stock.productSerialNumbers.map(sn => sn.serialNumber).join(', ')
                  : 'No serial numbers'}
              </td>
              <td className="border p-1">
                {stock.productSerialNumbersReceived.length > 0
                  ? stock.productSerialNumbersReceived.map(sn => sn.serialNumber).join(', ')
                  : 'No serial numbers received'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaTruck className="mr-3 text-indigo-600" /> 
            Shipment Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Reference Number</p>
            <p className="font-semibold">{referenceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className={`font-semibold ${getStatusBadgeColor(status)}`}>
              {status?.toUpperCase() || 'UNKNOWN'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Source Warehouse</p>
            <p className="font-semibold">
              {sourceWarehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Destination Warehouse</p>
            <p className="font-semibold">
              {destinationWarehouse?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Driver</p>
            <p className="font-semibold">{driverName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vehicle</p>
            <p className="font-semibold">{vehicle?.code || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <FaBox className="mr-2 text-indigo-600" />
            <span className="font-semibold text-gray-700">Shipment Stocks</span>
          </div>
          {renderStocksTable()}
        </div>

        {/* Delivery Remarks */}
        {notes && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Delivery Notes</h3>
            <p className="text-sm text-gray-600">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetailsModal;
