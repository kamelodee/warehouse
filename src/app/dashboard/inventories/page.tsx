'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { MdRefresh } from 'react-icons/md';
import { withAuth as AuthWrapper } from '@/app/components/withAuth';
import { refreshDrivers, refreshProducts, refreshTransfers, refreshVehicles, refreshWarehouses } from '@/app/api/warehouseService';
import InventoryTableComponent from './InventoryTableComponent';
import { 
  getInventoryItems, 
  InventoryItem
} from '@/app/api/inventoryService';
import dynamic from 'next/dynamic';

// Dynamically import components with loading fallbacks
const CSVUploadModal = dynamic(() => import('./CSVUploadModal').then(mod => ({ default: mod.default })), {
  loading: () => <div className="p-4 border rounded shadow-sm">Loading upload form...</div>,
  ssr: false
});

const CreateInventoryModal = dynamic(() => import('./components/CreateInventoryModal').then(mod => ({ default: mod.CreateInventoryModal })), {
  loading: () => <div className="p-4 border rounded shadow-sm">Loading create form...</div>,
  ssr: false
});

interface PageFilters {
  status?: string;
  warehouseId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const InventoryPage = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PageFilters>({});
  const [page, setPage] = useState<number>(0); // API uses 0-based indexing
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('serialNumber');
  const [sort, setSort] = useState<string>('ASC');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch initial data
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      window.location.href = '/login';
    } else {
      fetchInventoryItems();
    }
  }, []);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchInventoryItems();
  }, [filters, page, pageSize, sortField, sort]);

  // Fetch function to get inventory items
  const fetchInventoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert page filters to API filters
      const apiFilters: {
        pageNumber: number;
        pageSize: number;
        sortBy: string;
        sortOrder: string;
      } & PageFilters = {
        ...filters,
        pageNumber: page,
        pageSize,
        sortBy: sortField,
        sortOrder: sort
      };
      
      const response = await getInventoryItems(apiFilters);
      
      if (response && response.content) {
        setInventoryItems(response.content);
        setTotalPages(response.totalPages);
      } else {
        setInventoryItems([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to load inventory items. Please try again.');
      setInventoryItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshInventory = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      // Refresh all data sources
      await Promise.all([
        refreshProducts(),
        refreshWarehouses(),
        refreshVehicles(),
        refreshDrivers(),
        refreshTransfers()
      ]);
      
      // Refresh inventory items
      await fetchInventoryItems();
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateInventoryClick = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    fetchInventoryItems(); // Refresh after closing modal
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    fetchInventoryItems(); // Refresh after closing modal
  };

  return (
    <div className="p-4">
      <h1 className="text-black font-bold mb-4">Inventory Management</h1>
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleCreateInventoryClick} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Add Inventory
        </button>
        <button 
          onClick={handleUploadClick} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Upload CSV
        </button>
        <button 
          onClick={handleRefreshInventory} 
          className={`${isRefreshing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        {showCreateModal && (
          <CreateInventoryModal 
            isOpen={showCreateModal}
            onClose={handleCloseCreateModal}
          />
        )}
        {showUploadModal && (
          <CSVUploadModal 
            isOpen={showUploadModal}
            onClose={handleCloseUploadModal}
            onSuccess={fetchInventoryItems}
          />
        )}
      </Suspense>
      
      <div className="flex space-x-4 mb-4">
        <div>
          <label htmlFor="size" className="border rounded p-1 text-black">Size:</label>
          <input
            type="number"
            id="size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            min="1"
            className="border rounded p-1 text-black"
          />
        </div>
        <div>
          <label htmlFor="sortField" className="border rounded p-1 text-black">Sort By:</label>
          <select
            id="sortField"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border rounded p-1 text-black"
          >
            <option value="serialNumber">Serial Number</option>
            <option value="productName">Product Name</option>
            <option value="quantity">Quantity</option>
            <option value="warehouseName">Warehouse</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="border rounded p-1 text-black">Order:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded p-1 text-black"
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
        <button 
          onClick={fetchInventoryItems} 
          disabled={loading}
          className="bg-indigo-600 text-white rounded p-1"
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
      
      <div className="pagination mb-4 text-black">
        <button 
          onClick={() => setPage(prev => Math.max(prev - 1, 0))} 
          disabled={page === 0 || loading} 
          className="bg-gray-300 rounded p-2 mr-2"
        >
          Previous
        </button>
        <span className="mx-2 text-black">Page {page + 1} of {totalPages}</span>
        <button 
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} 
          disabled={page + 1 === totalPages || loading} 
          className="bg-gray-300 rounded p-2 ml-2"
        >
          Next
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-black">Loading inventory items...</p>
        </div>
      ) : (
        <InventoryTableComponent 
          items={inventoryItems}
          loading={loading}
          error={error}
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </div>
  );
};

export default AuthWrapper(InventoryPage);