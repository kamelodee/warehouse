'use client';

import React, { useState, useEffect } from 'react';
import { TransferFilter } from '@/types/transfer';
import { fetchWarehouses } from '@/app/utils/warehouseService';

interface SimpleWarehouse {
  id: string;
  name: string;
}

interface TransfersFiltersProps {
  filters: TransferFilter;
  onFilterChange: (filters: TransferFilter) => void;
}

const TransfersFilters: React.FC<TransfersFiltersProps> = ({ filters, onFilterChange }) => {
  const [warehouses, setWarehouses] = useState<SimpleWarehouse[]>([]);
  const [warehousesError, setWarehousesError] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState<TransferFilter>(filters);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const loadWarehouses = async () => {
      try {
        const warehouseList = await fetchWarehouses();
        setWarehouses(warehouseList);
        setWarehousesError(warehouseList.length === 0 ? 'No warehouses found' : null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load warehouses';
        console.error('Warehouse loading error:', error);
        setWarehouses([]); 
        setWarehousesError(errorMessage);
      }
    };

    loadWarehouses();
  }, []);

  const handleSourceWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...localFilters,
      where: {
        ...localFilters.where,
        sourceWarehouse: e.target.value || undefined
      }
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDestinationWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...localFilters,
      where: {
        ...localFilters.where,
        destinationWarehouse: e.target.value || undefined
      }
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...localFilters,
      generalSearch: {
        value: e.target.value,
        fields: ['referenceNumber', 'status']
      }
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: TransferFilter = {
      where: {},
      generalSearch: {
        value: '',
        fields: []
      }
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Source Warehouse</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={localFilters.where.sourceWarehouse || ''}
          onChange={handleSourceWarehouseChange}
          disabled={!!warehousesError}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((warehouse) => (
            <option 
              key={warehouse.id} 
              value={warehouse.name}
            >
              {warehouse.name}
            </option>
          ))}
        </select>
        {warehousesError && (
          <p className="text-red-500 text-xs mt-1">{warehousesError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Destination Warehouse</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={localFilters.where.destinationWarehouse || ''}
          onChange={handleDestinationWarehouseChange}
          disabled={!!warehousesError}
        >
          <option value="">All Warehouses</option>
          {warehouses.map((warehouse) => (
            <option 
              key={warehouse.id} 
              value={warehouse.name}
            >
              {warehouse.name}
            </option>
          ))}
        </select>
        {warehousesError && (
          <p className="text-red-500 text-xs mt-1">{warehousesError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Search</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Search by reference number or status"
          value={localFilters.generalSearch.value}
          onChange={handleSearchChange}
        />
      </div>

      {(localFilters.where.sourceWarehouse || 
        localFilters.where.destinationWarehouse || 
        localFilters.generalSearch.value) && (
        <div className="col-span-full flex justify-end">
          <button
            onClick={handleClearFilters}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TransfersFilters;
