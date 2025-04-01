import React from 'react';
import { FaTimes, FaTruck, FaWarehouse, FaCalendar, FaClipboardList, FaTag, FaBox, FaUser, FaCheckCircle } from 'react-icons/fa';
import { Shipment, ShipmentStock } from '../../api/shipmentService';
import { Warehouse } from '../../api/warehouseService';
import { Vehicle } from '../../api/vehicleService';
import { searchProducts, Product } from '../../api/productService';

interface ShipmentDetailsModalProps {
  shipment: Shipment & { id: number };
  warehouses: { [key: number]: Warehouse };
  vehicles: { [key: number]: Vehicle };
  onClose: () => void;
}

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ 
  shipment, 
  warehouses, 
  vehicles, 
  onClose 
}) => {
  const [productDetails, setProductDetails] = React.useState<{ [key: number]: {
    id: number;
    code: string;
    name: string;
    category: string | null;
    barcodes: string[];
  } }>({});

  // Fetch product details for stocks
  React.useEffect(() => {
    const fetchProductDetails = async () => {
      if (!shipment.stocks) return;

      const productDetailsMap: { [key: number]: {
        id: number;
        code: string;
        name: string;
        category: string | null;
        barcodes: string[];
      } } = {};
      shipment.stocks.forEach(stock => {
        if (stock.productId) {
          productDetailsMap[stock.productId] = {
            id: stock.productId,
            code: 'N/A',
            name: 'N/A',
            category: null,
            barcodes: []
          };
        }
      });

      setProductDetails(productDetailsMap);
    };

    fetchProductDetails();
  }, [shipment.stocks]);

  // Helper function to get warehouse name
  const getWarehouseName = (warehouseId?: number) => {
    return warehouseId && warehouses[warehouseId] 
      ? warehouses[warehouseId].name 
      : 'Unknown Warehouse';
  };

  // Helper function to get vehicle name
  const getVehicleName = (vehicleId?: number) => {
    return vehicleId && vehicles[vehicleId] 
      ? vehicles[vehicleId].code
      : 'Unassigned';
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status?: string | null) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render stocks table
  const renderStocksTable = () => {
    return (
      <table className="w-full border-collapse text-black text-xs">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-1 text-left">Product Code</th>
            <th className="border p-1 text-left">Product Name</th>
            <th className="border p-1 text-left">Category</th>
            <th className="border p-1 text-left">Qty</th>
            <th className="border p-1 text-left">Qty Rcv</th>
            <th className="border p-1 text-left">Barcodes</th>
            <th className="border p-1 text-left">Serial Nums</th>
            <th className="border p-1 text-left">Serial Nums Rcv</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(productDetails).map(([productIdStr, product], index) => {
            const productId = parseInt(productIdStr);
            const stock = shipment.stocks?.find(s => s.productId === productId);
            return (
              <tr key={index} className="border-b">
                <td className="border p-1">{product.code || 'N/A'}</td>
                <td className="border p-1">{product.name || 'N/A'}</td>
                <td className="border p-1">{product.category || 'N/A'}</td>
                <td className="border p-1">{stock?.quantity || 0}</td>
                <td className="border p-1">{stock?.quantityReceived || 'N/A'}</td>
                <td className="border p-1">
                  {product.barcodes && product.barcodes.length > 0
                    ? product.barcodes.join(', ') 
                    : 'No barcode'}
                </td>
                <td className="border p-1">
                  {stock?.productSerialNumbers && stock.productSerialNumbers.length > 0
                    ? stock.productSerialNumbers.join(', ')
                    : 'No serial numbers'}
                </td>
                <td className="border p-1">
                  {stock?.productSerialNumbersReceived && stock.productSerialNumbersReceived.length > 0
                    ? stock.productSerialNumbersReceived.join(', ')
                    : 'No serial numbers received'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaClipboardList className="mr-3 text-indigo-600" />
            Shipment Details
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Shipment Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaTag className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Reference Number</span>
              </div>
              <p className="text-gray-900">{shipment.referenceNumber || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaUser className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Driver Name</span>
              </div>
              <p className="text-gray-900">{shipment.driverName || 'N/A'}</p>
            </div>
          </div>

          {/* Warehouse and Vehicle Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaWarehouse className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Source Warehouse</span>
              </div>
              <p className="text-gray-900">
                {shipment.sourceWarehouseId && warehouses[shipment.sourceWarehouseId]
                  ? `${warehouses[shipment.sourceWarehouseId].name} (${warehouses[shipment.sourceWarehouseId].code})`
                  : 'N/A'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaWarehouse className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Destination Warehouse</span>
              </div>
              <p className="text-gray-900">
                {shipment.destinationWarehouseId && warehouses[shipment.destinationWarehouseId]
                  ? `${warehouses[shipment.destinationWarehouseId].name} (${warehouses[shipment.destinationWarehouseId].code})`
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaTruck className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Vehicle</span>
              </div>
              <p className="text-gray-900">
                {shipment.vehicleId && vehicles[shipment.vehicleId] 
                  ? vehicles[shipment.vehicleId].code 
                  : 'Unassigned'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaCheckCircle className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Status</span>
              </div>
              <p className={`font-semibold ${getStatusBadgeColor(shipment.status)}`}>
                {shipment.status || 'N/A'}
              </p>
            </div>
          </div>

          {/* Delivery Remarks */}
          {shipment.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaClipboardList className="mr-2 text-indigo-600" />
                <span className="font-semibold text-gray-700">Delivery Remarks</span>
              </div>
              <p className="text-gray-900">{shipment.notes}</p>
            </div>
          )}

          {/* Shipment Stocks */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <FaBox className="mr-2 text-indigo-600" />
              <span className="font-semibold text-gray-700">Shipment Stocks</span>
            </div>
            {renderStocksTable()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailsModal;
