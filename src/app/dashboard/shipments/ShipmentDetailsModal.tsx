import React from 'react';
import { FaTruck } from 'react-icons/fa';
import { Shipment } from '../../api/shipmentService';

interface ShipmentDetailsModalProps {
    shipment: Shipment;
    onClose: () => void;
}

const getStatusBadgeColor = (status?: string | null) => {
    switch (status?.toUpperCase()) {
        case 'DELIVERED':
            return 'bg-green-100 text-green-800';
        case 'IN_TRANSIT':
            return 'bg-yellow-100 text-yellow-800';
        case 'INCOMPLETE':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({ 
    shipment, 
    onClose 
}) => {
    const renderStocksTable = () => {
        return (
            <table className="w-full border-collapse text-black text-xs">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-1">Product ID</th>
                        <th className="border p-1">Product Code</th>
                        <th className="border p-1">Product Name</th>
                        <th className="border p-1">Category</th>
                        <th className="border p-1">Quantity</th>
                        <th className="border p-1">Quantity Received</th>
                        <th className="border p-1">Serialized</th>
                        <th className="border p-1">Barcodes</th>
                    </tr>
                </thead>
                <tbody>
                    {shipment.stocks.map((stock, index) => (
                        <tr key={index} className="border-b">
                            <td className="border p-1">{stock.product.id}</td>
                            <td className="border p-1">{stock.product.code}</td>
                            <td className="border p-1">{stock.product.name}</td>
                            <td className="border p-1">{stock.product.category || 'N/A'}</td>
                            <td className="border p-1">{stock.quantity}</td>
                            <td className="border p-1">{stock.quantityReceived || 'N/A'}</td>
                            <td className="border p-1">{stock.product.serialized ? 'Yes' : 'No'}</td>
                            <td className="border p-1">
                                {stock.product.barcodes.length > 0 
                                    ? stock.product.barcodes.join(', ') 
                                    : 'No barcodes'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        <p className="text-sm text-gray-900">Reference Number</p>
                        <p className="font-semibold">{shipment.referenceNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-900">Status</p>
                        <p className={`font-semibold ${getStatusBadgeColor(shipment.status)}`}>
                            {shipment.status?.toUpperCase() || 'UNKNOWN'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-900">Source Warehouse</p>
                        <p className="font-semibold">
                            {shipment.sourceWarehouse?.name || 'N/A'} 
                            <span className="text-xs text-gray-900 ml-2">
                                ({shipment.sourceWarehouse?.code || 'No Code'}, {shipment.sourceWarehouse?.location || 'No Location'})
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-900">Destination Warehouse</p>
                        <p className="font-semibold">
                            {shipment.destinationWarehouse?.name || 'N/A'}
                            <span className="text-xs text-gray-900 ml-2">
                                ({shipment.destinationWarehouse?.code || 'No Code'}, {shipment.destinationWarehouse?.location || 'No Location'})
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-900">Driver</p>
                        <p className="font-semibold">{shipment.driverName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-900">Vehicle</p>
                        <p className="font-semibold">
                            {shipment.vehicle?.code || 'N/A'}
                            {shipment.vehicle?.identificationNumber && (
                                <span className="text-xs text-gray-900 ml-2">
                                    (ID: {shipment.vehicle.identificationNumber})
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Shipment Stocks</h3>
                    {renderStocksTable()}
                </div>

                {shipment.deliveryRemarks && (
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Notes</h3>
                        <p className="text-sm text-gray-900">{shipment.deliveryRemarks}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-900">Complete Status</p>
                        <p className="font-semibold">
                            {shipment.completeStatus || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShipmentDetailsModal;
