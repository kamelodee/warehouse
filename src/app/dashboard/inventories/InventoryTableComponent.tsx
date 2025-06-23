import React, { useState } from 'react';
import { MdNavigateBefore, MdNavigateNext, MdVisibility } from 'react-icons/md';
import { InventoryItem, viewInventoryItem } from '@/app/api/inventoryService';
import InventoryDetailModal from './InventoryDetailModal';
import './InventoryDetailModal.css';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const InventoryTableComponent: React.FC<InventoryTableProps> = ({
  items,
  loading,
  error,
  page,
  totalPages,
  onPageChange
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-indigo-600'; // green
      case 'pending':
        return 'bg-orange-500'; // orange
      case 'sold':
        return 'bg-blue-500'; // blue
      case 'damaged':
        return 'bg-red-500'; // red
      default:
        return '#9e9e9e'; // grey
    }
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };
  
  const handleViewDetails = async (itemId: number) => {
    setDetailsLoading(true);
    setDetailsError(null);
    
    try {
      const itemDetails = await viewInventoryItem(itemId);
      setSelectedItem(itemDetails);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching inventory details:', err);
      setDetailsError('Failed to load inventory details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };
  
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading inventory items...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No inventory items found. Try adjusting your filters or adding new items.</p>
      </div>
    );
  }
  
  return (
    <div className="inventory-table-container">
      <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product?.name || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product?.code || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product?.category || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <button 
                  className="text-blue-500 hover:text-blue-700 mr-2"
                  onClick={() => handleViewDetails(item.id)}
                  disabled={detailsLoading}
                >
                  <MdVisibility size={18} />
                 
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination mb-4 text-black">
        <button 
          onClick={handlePrevPage} 
          disabled={page <= 0}
          className="bg-gray-300 rounded p-2 mr-2"
        >
          Previous
        </button>
        
        <span className="mx-2 text-black">Page {page + 1} of {Math.max(1, totalPages)}</span>
        
        <button 
          onClick={handleNextPage} 
          disabled={page >= totalPages - 1}
          className="bg-gray-300 rounded p-2 ml-2"
        >
          Next
        </button>
      </div>
      
      {/* Details Modal */}
      <InventoryDetailModal 
        item={selectedItem}
        isOpen={showDetailsModal}
        onClose={closeDetailsModal}
      />
      
      {detailsError && (
        <div className="error-toast">
          {detailsError}
          <button onClick={() => setDetailsError(null)}>Dismiss</button>
        </div>
      )}
      
      <style jsx>{`
        .inventory-table-container {
          width: 100%;
          overflow-x: auto;
        }
        
        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        
        .inventory-table th {
          background-color: #f5f5f5;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e0e0e0;
          position: sticky;
          top: 0;
        }
        
        .inventory-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #e0e0e0;
          vertical-align: middle;
        }
        
        .inventory-table tr:hover {
          background-color: #f9f9f9;
        }
        
        .pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .pagination-info {
          font-size: 0.875rem;
          color: #666;
        }
        
        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .pagination-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .pagination-button:hover:not(:disabled) {
          background-color: #f5f5f5;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #2196f3;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-container {
          padding: 1rem;
          background-color: #ffebee;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .error-message {
          color: #d32f2f;
          margin: 0;
        }
        
        .empty-state {
          padding: 2rem;
          text-align: center;
          background-color: #f5f5f5;
          border-radius: 4px;
          color: #666;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .action-button:hover:not(:disabled) {
          background-color: #f5f5f5;
        }
        
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .view-button {
          background-color: #4caf50;
          color: white;
        }
        
        .view-button:hover:not(:disabled) {
          background-color: #3e8e41;
        }
        
        .error-toast {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background-color: #ffebee;
          border-radius: 4px;
          padding: 1rem;
          border: 1px solid #d32f2f;
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default InventoryTableComponent;
