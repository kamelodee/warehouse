'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getTransfers, refreshTransfers } from '@/app/api/transferService';
import { getWarehouses } from '@/app/api/warehouseService';
import { Transfer, Warehouse } from '@/types/transfer';
import TransferFilters from './components/TransferFilters';
import TransferTable from './components/TransferTable';
import CreateTransferModal from './components/CreateTransferModal';

const Transfers = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Pagination and filtering states
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [sort, setSort] = useState<string>('ASC');
  const [sortField, setSortField] = useState<string>('id');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalTransfers, setTotalTransfers] = useState<number>(0);
  
  // Filter states
  const [sourceWarehouse, setSourceWarehouse] = useState<number | undefined>(undefined);
  const [destinationWarehouse, setDestinationWarehouse] = useState<number | undefined>(undefined);
  const [type, setType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const where = {
        ...(sourceWarehouse && { sourceWarehouseId: sourceWarehouse }),
        ...(destinationWarehouse && { destinationWarehouseId: destinationWarehouse }),
        ...(type && { type }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };

      const data = await getTransfers(
        page, 
        size, 
        sort, 
        sortField, 
        where
      );

      setTransfers(data.content);
      setTotalPages(data.totalPages);
      setTotalTransfers(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, sort, sortField, sourceWarehouse, destinationWarehouse, type, startDate, endDate]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await getWarehouses();
      // Map warehouses to the expected type
      const warehouseItems: Warehouse[] = (
        Array.isArray(response) ? response : (response as { items: any[] }).items || []
      ).map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code || '',
        description: warehouse.description || '',
        location: warehouse.location || '',
        emails: warehouse.emails || [],
        status: warehouse.status || 'active'
      }));
      
      setWarehouses(warehouseItems);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleApplyFilters = (filters: {
    sourceWarehouse?: number;
    destinationWarehouse?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
  }) => {
    setSourceWarehouse(filters.sourceWarehouse);
    setDestinationWarehouse(filters.destinationWarehouse);
    setType(filters.type || '');
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    
    // Update pagination and sorting
    if (filters.page !== undefined) setPage(filters.page);
    if (filters.size !== undefined) setSize(filters.size);
    if (filters.sort) setSort(filters.sort);
    if (filters.sortField) setSortField(filters.sortField);
  };

  const handleCreateTransfer = () => {
    setIsCreateModalOpen(true);
  };

  const handleRefreshTransfers = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await refreshTransfers();
      fetchTransfers(); // Refresh the transfers list after successful refresh
    } catch (error) {
      console.error('Error refreshing transfers:', error);
      setError(error as Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTransferCreated = () => {
    fetchTransfers(); // Refresh the transfers list
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-black font-bold mb-4">Transfers Management</h1>
      
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleCreateTransfer} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Create Transfer
        </button>
        <button 
          onClick={handleRefreshTransfers} 
          className={`${isRefreshing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <TransferFilters 
        warehouses={warehouses} 
        onApplyFilters={handleApplyFilters} 
      />

      <TransferTable 
        transfers={transfers} 
        totalTransfers={totalTransfers}
        totalPages={totalPages}
        currentPage={page}
        onRefresh={fetchTransfers}
      />

      {isCreateModalOpen && (
        <CreateTransferModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleTransferCreated}
          warehouses={warehouses}
        />
      )}


    </div>
  );
};

export default Transfers;
