'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdRefresh, MdUpload } from 'react-icons/md';
import { withAuth as AuthWrapper } from '@/app/components/withAuth';
import { refreshDrivers, refreshProducts, refreshTransfers, refreshVehicles, refreshWarehouses } from '@/app/api/warehouseService';
import InventoryTableComponent from './InventoryTableComponent';
import { 
  getInventoryItems, 
  uploadInventoryCSV, 
  processInventoryCSV,
  InventoryItem,
  InventorySearchResponse
} from '@/app/api/inventoryService';
import CSVUploadModal from './CSVUploadModal';
import { CreateInventoryModal } from './components/CreateInventoryModal';

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
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('serialNumber');
  const [sort, setSort] = useState<string>('ASC');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchInventoryItems();
    
    // Clean up any timeouts on unmount
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    fetchInventoryItems();
  }, [filters, page, pageSize, sortField, sort]);

  // Debounced fetch function to prevent excessive API calls
  const fetchInventoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching inventory items with filters:', filters);
      
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
      
      console.log('Inventory response:', response);
      
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = async () => {
    setLoading(true);
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
      fetchInventoryItems();
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefreshInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Refresh inventory items
      await fetchInventoryItems();
    } catch (error: any) {
      console.error('Error refreshing inventory:', error);
      setError('Failed to refresh inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  const handleCreateInventoryClick = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    fetchInventoryItems(); // Refresh the inventory list
    
    // Clear success message after 5 seconds
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    successTimeoutRef.current = setTimeout(() => {
      setUploadSuccess(false);
    }, 5000);
  };

  // Filter section removed as requested

  return (
    <div className="inventory-page">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Inventory Management</h1>
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={handleCreateInventoryClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Create Inventory
        </button>
        <button 
          onClick={handleRefreshInventory}
          disabled={loading}
          className={`${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="success-alert">
          <p>CSV file processed successfully!</p>
        </div>
      )}
      
      <InventoryTableComponent 
        items={inventoryItems}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      
      <CSVUploadModal 
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
      />
      
      <CreateInventoryModal 
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
      />
      
      <style jsx>{`
        .inventory-page {
          padding: 1.5rem;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .header-actions-left {
          display: flex;
          gap: 1rem;
        }
        
        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }
        
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        
        .refresh-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .refresh-button:hover {
          background-color: #f5f5f5;
        }
        
        .refresh-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .upload-button {
          padding: 0.5rem 1rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .upload-button:hover {
          background-color: #4f46e5;
        }
        
        .icon {
          margin-right: 0.5rem;
        }
        
        .error-alert {
          padding: 0.75rem 1rem;
          background-color: #ffebee;
          border-radius: 4px;
          margin-bottom: 1rem;
          color: #d32f2f;
        }
        
        .success-alert {
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          border-radius: 4px;
          animation: fadeOut 5s forwards;
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AuthWrapper(InventoryPage);