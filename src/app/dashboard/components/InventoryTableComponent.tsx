import React from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';

interface InventoryItem {
  id: string;
  serialNumber: string;
  status: string;
  productName: string;
  warehouseName: string;
  createdAt: string;
}

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
    switch (status.toLowerCase()) {
      case 'active':
        return '#4caf50'; // green
      case 'pending':
        return '#ff9800'; // orange
      case 'sold':
        return '#2196f3'; // blue
      case 'damaged':
        return '#f44336'; // red
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
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Product</th>
            <th>Warehouse</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.serialNumber}</td>
              <td>{item.productName}</td>
              <td>{item.warehouseName}</td>
              <td>
                <div className="status-indicator">
                  <span 
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  ></span>
                  <span className="status-text">{item.status}</span>
                </div>
              </td>
              <td>{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination-controls">
        <div className="pagination-info">
          Page {page} of {totalPages}
        </div>
        <div className="pagination-buttons">
          <button 
            className="pagination-button"
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            <MdNavigateBefore />
            Previous
          </button>
          <button 
            className="pagination-button"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next
            <MdNavigateNext />
          </button>
        </div>
      </div>
      
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
        
        .status-indicator {
          display: flex;
          align-items: center;
        }
        
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }
        
        .status-text {
          text-transform: capitalize;
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
      `}</style>
    </div>
  );
};

export default InventoryTableComponent;
