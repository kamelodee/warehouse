"use client";

import React, { useState, useEffect } from 'react';
import { Warehouse } from '@/types/transfer';

interface TransferFiltersProps {
  warehouses: Warehouse[];
  onApplyFilters: (filters: {
    sourceWarehouse?: number;
    destinationWarehouse?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

const TransferFilters: React.FC<TransferFiltersProps> = ({ 
  warehouses, 
  onApplyFilters 
}) => {
  const [sourceWarehouse, setSourceWarehouse] = useState<number | undefined>(undefined);
  const [destinationWarehouse, setDestinationWarehouse] = useState<number | undefined>(undefined);
  const [type, setType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const transferTypes = ['Incoming', 'Outgoing', 'Internal'];

  const handleApplyFilters = () => {
    const filters = {
      sourceWarehouse,
      destinationWarehouse,
      type,
      startDate,
      endDate
    };
    
    onApplyFilters(filters);
  };

  useEffect(() => {
    console.log('Warehouses:', warehouses);
  }, [warehouses]);

  const handleResetFilters = () => {
    setSourceWarehouse(undefined);
    setDestinationWarehouse(undefined);
    setType('');
    setStartDate('');
    setEndDate('');
    
    onApplyFilters({
      sourceWarehouse: undefined,
      destinationWarehouse: undefined,
      type: '',
      startDate: '',
      endDate: ''
    });
  };

  const activeFiltersCount = [
    sourceWarehouse, 
    destinationWarehouse, 
    type, 
    startDate, 
    endDate
  ].filter(filter => filter !== undefined && filter !== '').length;

  return (
    <div className=" rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source Warehouse</label>
          <select 
            value={sourceWarehouse || ''} 
            onChange={(e) => setSourceWarehouse(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination Warehouse</label>
          <select 
            value={destinationWarehouse || ''} 
            onChange={(e) => setDestinationWarehouse(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">All Types</option>
            {transferTypes.map(transferType => (
              <option key={transferType} value={transferType}>
                {transferType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        <div className="flex items-end space-x-2">
          <button 
            onClick={handleApplyFilters}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Apply Filters
          </button>
          {activeFiltersCount > 0 && (
            <button 
              onClick={handleResetFilters}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active Filters:</span>
          {sourceWarehouse && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              Source: {warehouses.find(w => w.id === sourceWarehouse)?.name}
            </span>
          )}
          {destinationWarehouse && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              Destination: {warehouses.find(w => w.id === destinationWarehouse)?.name}
            </span>
          )}
          {type && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              Type: {type}
            </span>
          )}
          {startDate && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              From: {startDate}
            </span>
          )}
          {endDate && (
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
              To: {endDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferFilters;
