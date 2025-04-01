'use client';

import React, { useState } from 'react';
import { 
  FaTruck, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaBox, 
  FaClipboardCheck, 
  FaExchangeAlt, 
  FaEdit, 
  FaPrint, 
  FaDownload, 
  FaShareAlt 
} from 'react-icons/fa';

interface Shipment {
  id: string;
  referenceNumber: string;
  status: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  createdAt: string;
  updatedAt: string;
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalValue: number;
}

interface ShipmentDetailsModalProps {
  shipment: Shipment;
  onClose: () => void;
  onEdit?: (shipment: Shipment) => void;
  onPrint?: (shipment: Shipment) => void;
  onDownload?: (shipment: Shipment) => void;
  onShare?: (shipment: Shipment) => void;
}

export default function ShipmentDetailsModal({ 
  shipment, 
  onClose, 
  onEdit, 
  onPrint, 
  onDownload, 
  onShare 
}: ShipmentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'tracking'>('overview');

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'in_transit': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Action buttons
  const ActionButtons = () => (
    <div className="flex space-x-2 mt-4">
      {onEdit && (
        <button 
          onClick={() => onEdit(shipment)}
          className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
        >
          <FaEdit />
          <span>Edit Shipment</span>
        </button>
      )}
      {onPrint && (
        <button 
          onClick={() => onPrint(shipment)}
          className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
        >
          <FaPrint />
          <span>Print</span>
        </button>
      )}
      {onDownload && (
        <button 
          onClick={() => onDownload(shipment)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
        >
          <FaDownload />
          <span>Download</span>
        </button>
      )}
      {onShare && (
        <button 
          onClick={() => onShare(shipment)}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
        >
          <FaShareAlt />
          <span>Share</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-4 my-8 bg-white rounded-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <FaTruck className="text-3xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Shipment Details
              </h2>
              <p className="text-sm text-gray-500">
                Reference: {shipment.referenceNumber}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${getStatusColor(shipment.status)} font-semibold`}>
            {shipment.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['overview', 'products', 'tracking'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'overview' | 'products' | 'tracking')}
              className={`px-4 py-3 capitalize ${
                activeTab === tab 
                  ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipment Route */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <FaExchangeAlt className="mr-2 text-purple-600" />
                  <span className="font-semibold text-gray-700">Shipment Route</span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-green-600" />
                      <span className="font-medium text-gray-700">Source</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{shipment.sourceWarehouse}</p>
                  </div>
                  <div className="mx-4 h-0.5 w-10 bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-600" />
                      <span className="font-medium text-gray-700">Destination</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{shipment.destinationWarehouse}</p>
                  </div>
                </div>
              </div>

              {/* Shipment Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <FaCalendarAlt className="mr-2 text-indigo-600" />
                  <span className="font-semibold text-gray-700">Key Dates</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Created</span>
                    <p className="font-medium text-gray-800">
                      {new Date(shipment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <p className="font-medium text-gray-800">
                      {new Date(shipment.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 text-gray-600">Product</th>
                    <th className="py-3 text-gray-600">Quantity</th>
                    <th className="py-3 text-gray-600">Unit Price</th>
                    <th className="py-3 text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.products.map((product, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="py-3 text-gray-700">{product.quantity}</td>
                      <td className="py-3 text-gray-700">₵{product.unitPrice.toFixed(2)}</td>
                      <td className="py-3 font-bold text-gray-900">
                        ₵{(product.quantity * product.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right">
                <span className="font-semibold text-gray-700">Total Shipment Value: </span>
                <span className="text-xl font-bold text-green-600">₵{shipment.totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Shipment Timeline</h3>
                <div className="relative pl-6 border-l-2 border-blue-200">
                  {(() => {
                    const events = [
                      { 
                        status: 'Created', 
                        date: shipment.createdAt, 
                        icon: <FaBox className="text-blue-600" /> 
                      },
                      { 
                        status: shipment.status === 'in_transit' ? 'In Transit' : 'Processed', 
                        date: shipment.updatedAt, 
                        icon: <FaTruck className="text-green-600" /> 
                      }
                    ];

                    if (shipment.status === 'delivered') {
                      events.push({ 
                        status: 'Delivered', 
                        date: shipment.updatedAt, 
                        icon: <FaClipboardCheck className="text-green-600" /> 
                      });
                    }

                    return events.map((event, index) => (
                      <div key={index} className="mb-4 pl-8 relative">
                        <div className="absolute left-[-13px] top-1 bg-white border-2 border-blue-200 rounded-full p-1">
                          {event.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{event.status}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <ActionButtons />
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
