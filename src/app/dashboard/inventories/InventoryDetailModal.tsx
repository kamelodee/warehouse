import React from 'react';
import { MdClose } from 'react-icons/md';
import { InventoryItem } from '@/app/api/inventoryService';

interface InventoryDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  isOpen: boolean;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({ 
  item, 
  onClose, 
  isOpen 
}) => {
  if (!isOpen || !item) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#9e9e9e'; // grey
    
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Inventory Item Details</h2>
          <button className="close-button" onClick={onClose}>
            <MdClose size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{item.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{item.quantity}</span>
              </div>
              {item.status && (
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  >
                    {item.status}
                  </span>
                </div>
              )}
              {item.serialNumber && (
                <div className="detail-item">
                  <span className="detail-label">Serial Number:</span>
                  <span className="detail-value">{item.serialNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Product Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Product Name:</span>
                <span className="detail-value">{item.product.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Product Code:</span>
                <span className="detail-value">{item.product.code}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{item.product.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Serialized:</span>
                <span className="detail-value">{item.product.serialized ? 'Yes' : 'No'}</span>
              </div>
              {item.product.barcodes && item.product.barcodes.length > 0 && (
                <div className="detail-item full-width">
                  <span className="detail-label">Barcodes:</span>
                  <div className="barcode-list">
                    {item.product.barcodes.map((barcode, index) => (
                      <span key={index} className="barcode-item">{barcode}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {item.warehouse && (
            <div className="detail-section">
              <h3>Warehouse Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Warehouse Name:</span>
                  <span className="detail-value">{item.warehouse.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Warehouse Code:</span>
                  <span className="detail-value">{item.warehouse.code}</span>
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Shipping Information</h3>
            <div className="detail-grid">
              {item.batchNumber && (
                <div className="detail-item">
                  <span className="detail-label">Batch Number:</span>
                  <span className="detail-value">{item.batchNumber}</span>
                </div>
              )}
              {item.containerNumber && (
                <div className="detail-item">
                  <span className="detail-label">Container Number:</span>
                  <span className="detail-value">{item.containerNumber}</span>
                </div>
              )}
              {item.blNumber && (
                <div className="detail-item">
                  <span className="detail-label">BL Number:</span>
                  <span className="detail-value">{item.blNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Timestamps</h3>
            <div className="detail-grid">
              {item.createdAt && (
                <div className="detail-item">
                  <span className="detail-label">Created At:</span>
                  <span className="detail-value">{formatDate(item.createdAt)}</span>
                </div>
              )}
              {item.updatedAt && (
                <div className="detail-item">
                  <span className="detail-label">Updated At:</span>
                  <span className="detail-value">{formatDate(item.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailModal;
