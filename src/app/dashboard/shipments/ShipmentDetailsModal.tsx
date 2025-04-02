import React from 'react';
import { FaTruck, FaCheckCircle, FaClipboardList, FaBox } from 'react-icons/fa';
import { ProductSerialNumber } from '../../api/shipmentService';
import { Warehouse } from '../../api/warehouseService';
import { Vehicle } from '../../api/vehicleService';

interface ShipmentDetailsModalProps {
  shipment: {
    id: number;
    referenceNumber?: string | null;
    driverName: string;
    status?: string;
    deliveryRemarks?: string;
    vehicle?: Vehicle;
    sourceWarehouse?: Warehouse;
    destinationWarehouse?: Warehouse;
    stocks: Array<{
      quantity: number;
      quantityReceived: number;
      productId: number;
      productSerialNumbers: ProductSerialNumber[];
      productSerialNumbersReceived: ProductSerialNumber[];
    }>;
  };
  warehouses: { [key: number]: Warehouse };
  vehicles: { [key: number]: Vehicle };
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

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ shipment, onClose }) => {
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
          {shipment.stocks.map((stock, index) => (
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Shipment Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FaTruck className="mr-2 text-indigo-600" />
              <span className="font-semibold text-gray-700">Vehicle</span>
            </div>
            <p className="text-gray-900">{shipment.vehicle?.code || 'Unassigned'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FaCheckCircle className="mr-2 text-indigo-600" />
              <span className="font-semibold text-gray-700">Status</span>
            </div>
            <p className={`font-semibold ${getStatusBadgeColor(shipment.status)}`}>
              {shipment.status ?? 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FaTruck className="mr-2 text-indigo-600" />
              <span className="font-semibold text-gray-700">Source Warehouse</span>
            </div>
            <p className="text-gray-900">
              {shipment.sourceWarehouse?.name} ({shipment.sourceWarehouse?.code})
            </p>
            <p className="text-gray-600">{shipment.sourceWarehouse?.location}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FaTruck className="mr-2 text-indigo-600" />
              <span className="font-semibold text-gray-700">Destination Warehouse</span>
            </div>
            <p className="text-gray-900">
              {shipment.destinationWarehouse?.name} ({shipment.destinationWarehouse?.code})
            </p>
            <p className="text-gray-600">{shipment.destinationWarehouse?.location}</p>
          </div>

          {shipment.deliveryRemarks && (
            <div className="bg-gray-50 p-4 rounded-lg col-span-2">
              <div className="flex items-center mb-2">
                <FaClipboardList className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Delivery Remarks</span>
              </div>
              <p className="text-gray-900">{shipment.deliveryRemarks}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <FaBox className="mr-2 text-indigo-600" />
            <span className="font-semibold text-gray-700">Shipment Stocks</span>
          </div>
          {renderStocksTable()}
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailsModal;
