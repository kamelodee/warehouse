"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Warehouse } from '@/types/transfer';

interface TransferFiltersProps {
  warehouses: Warehouse[];
  onApplyFilters: (filters: {
    sourceWarehouse?: number;
    destinationWarehouse?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
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
  
  // Pagination and sorting states
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [sort, setSort] = useState<string>('ASC');
  const [sortField, setSortField] = useState<string>('id');

  const transferTypes = ['Incoming', 'Outgoing', 'Internal'];

  const handleApplyFilters = useCallback(() => {
    const filters = {
      sourceWarehouse,
      destinationWarehouse,
      type,
      startDate,
      endDate,
      page,
      size,
      sort,
      sortField
    };
    
    onApplyFilters(filters);
  }, [
    sourceWarehouse, 
    destinationWarehouse, 
    type, 
    startDate, 
    endDate, 
    page, 
    size, 
    sort, 
    sortField, 
    onApplyFilters
  ]);

  useEffect(() => {
    handleApplyFilters();
  }, [page, size, sort, sortField, handleApplyFilters]);

  const handleResetFilters = () => {
    setSourceWarehouse(undefined);
    setDestinationWarehouse(undefined);
    setType('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    setSize(10);
    setSort('ASC');
    setSortField('id');
    
    onApplyFilters({
      sourceWarehouse: undefined,
      destinationWarehouse: undefined,
      type: '',
      startDate: '',
      endDate: '',
      page: 0,
      size: 10,
      sort: 'ASC',
      sortField: 'id'
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
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <div>
          <label className="block text-xs text-gray-700 mb-1">Source Warehouse</label>
          <select 
            value={sourceWarehouse || ''} 
            onChange={(e) => setSourceWarehouse(e.target.value ? Number(e.target.value) : undefined)}
            className="border rounded p-1 text-black text-xs w-full"
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
          <label className="block text-xs text-gray-700 mb-1">Destination Warehouse</label>
          <select 
            value={destinationWarehouse || ''} 
            onChange={(e) => setDestinationWarehouse(e.target.value ? Number(e.target.value) : undefined)}
            className="border rounded p-1 text-black text-xs w-full"
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
          <label className="block text-xs text-gray-700 mb-1">Transfer Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="border rounded p-1 text-black text-xs w-full"
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
          <label className="block text-xs text-gray-700 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-1 text-black text-xs w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-700 mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-1 text-black text-xs w-full"
          />
        </div>

        <div className="flex items-end space-x-2">
          <button 
            onClick={handleApplyFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1 text-xs"
          >
            Apply Filters
          </button>
          <button 
            onClick={handleResetFilters}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded p-1 text-xs"
          >
            Clear
          </button>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600">Active Filters:</span>
          {sourceWarehouse && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              Source: {warehouses.find(w => w.id === sourceWarehouse)?.name}
            </span>
          )}
          {destinationWarehouse && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              Destination: {warehouses.find(w => w.id === destinationWarehouse)?.name}
            </span>
          )}
          {type && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              Type: {type}
            </span>
          )}
          {startDate && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              From: {startDate}
            </span>
          )}
          {endDate && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              To: {endDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferFilters;
