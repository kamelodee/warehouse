'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdRefresh, MdUpload } from 'react-icons/md';
import { withAuth as AuthWrapper } from '@/app/components/withAuth';
import InventoryFilters from './InventoryFilters';
import InventoryTableComponent from './InventoryTableComponent';
import { 
  getInventoryItems, 
  uploadInventoryCSV, 
  processInventoryCSV,
  InventoryItem,
  InventorySearchResponse,
  InventoryFilters as InventoryFilterParams
} from '@/app/api/inventoryService';
import CSVUploadModal from './CSVUploadModal';

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
  const [pageSize] = useState<number>(10);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
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
  }, [filters, page, pageSize]);

  // Debounced fetch function to prevent excessive API calls
  const fetchInventoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching inventory items with filters:', filters);
      
      // Convert page filters to API filters
      const apiFilters: InventoryFilterParams = {
        ...filters,
        page,
        size: pageSize
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

  const handleFilterChange = useCallback((newFilters: PageFilters) => {
    setPage(0); // Reset to first page when filters change
    setFilters(newFilters);
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchInventoryItems();
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
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

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1 className="page-title">Inventory Management</h1>
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            <MdRefresh className="icon" />
            Refresh
          </button>
          
          <button 
            onClick={handleUploadClick}
            className="upload-button"
          >
            <MdUpload className="icon" />
            Upload CSV
          </button>
        </div>
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
      
      <InventoryFilters onFilterChange={handleFilterChange} />
      
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