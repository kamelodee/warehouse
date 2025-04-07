'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdRefresh, MdUpload } from 'react-icons/md';
import { withAuth } from '@/app/components/withAuth';
import InventoryFilters from './InventoryFilters';
import InventoryTable from './InventoryTable';
import { getInventoryItems, uploadInventoryCSV, processCSVMapping, getProducts } from '@/app/api/inventoryService';

interface InventoryItem {
  id: string;
  serialNumber: string;
  status: string;
  productName: string;
  warehouseName: string;
  createdAt: string;
}

interface InventoryFilters {
  status?: string;
  warehouse?: string;
  search?: string;
}

const InventoryPage = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [showMappingDialog, setShowMappingDialog] = useState<boolean>(false);
  const [uploadedFileId, setUploadedFileId] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedSerialColumn, setSelectedSerialColumn] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [products, setProducts] = useState<Array<{id: string, name: string}>>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInventoryItems();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchInventoryItems();
  }, [filters, page, pageSize]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getInventoryItems({
        ...filters,
        page,
        size: pageSize
      });
      
      setInventoryItems(response.items);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError('Failed to load inventory items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleFilterChange = (newFilters: InventoryFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchInventoryItems();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      const response = await uploadInventoryCSV(file);
      
      setUploadedFileId(response.fileId);
      setCsvHeaders(response.headers);
      setShowMappingDialog(true);
      setUploadSuccess(true);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError('Failed to upload CSV file. Please check the file format and try again.');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProcessMapping = async () => {
    if (!uploadedFileId || !selectedSerialColumn || !selectedProduct || !selectedWarehouse) {
      setError('Please select all required mapping fields');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      await processCSVMapping({
        fileId: uploadedFileId,
        serialNumberColumn: selectedSerialColumn,
        productId: selectedProduct,
        warehouseId: selectedWarehouse
      });
      
      setShowMappingDialog(false);
      fetchInventoryItems(); // Refresh inventory list
      setUploadSuccess(true);
    } catch (err) {
      console.error('Error processing CSV mapping:', err);
      setError('Failed to process CSV mapping. Please try again.');
      setUploadSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelMapping = () => {
    setShowMappingDialog(false);
    setUploadedFileId('');
    setCsvHeaders([]);
    setSelectedSerialColumn('');
    setSelectedProduct('');
    setSelectedWarehouse('');
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
          
          <div className="upload-container">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file-input"
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload" 
              className="upload-button"
              style={{ opacity: isUploading ? 0.7 : 1 }}
            >
              <MdUpload className="icon" />
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </label>
          </div>
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
      
      <InventoryTable 
        items={inventoryItems}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      
      {showMappingDialog && (
        <div className="mapping-dialog-overlay">
          <div className="mapping-dialog">
            <h2 className="dialog-title">Map CSV Columns</h2>
            
            <div className="form-group">
              <label htmlFor="serial-column">Serial Number Column</label>
              <select
                id="serial-column"
                value={selectedSerialColumn}
                onChange={(e) => setSelectedSerialColumn(e.target.value)}
                className="select-input"
              >
                <option value="">Select Column</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="product-select">Product</label>
              <select
                id="product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="select-input"
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="warehouse-select">Warehouse</label>
              <select
                id="warehouse-select"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="select-input"
              >
                <option value="">Select Warehouse</option>
                <option value="warehouse1">Main Warehouse</option>
                <option value="warehouse2">Accra</option>
                <option value="warehouse3">Kumasi</option>
              </select>
            </div>
            
            <div className="dialog-actions">
              <button 
                className="cancel-button"
                onClick={handleCancelMapping}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className="process-button"
                onClick={handleProcessMapping}
                disabled={isProcessing || !selectedSerialColumn || !selectedProduct || !selectedWarehouse}
              >
                {isProcessing ? 'Processing...' : 'Process CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
          margin: 0;
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
        
        .upload-container {
          position: relative;
        }
        
        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }
        
        .upload-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .upload-button:hover {
          background-color: #1976d2;
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
          padding: 0.75rem 1rem;
          background-color: #e8f5e9;
          border-radius: 4px;
          margin-bottom: 1rem;
          color: #2e7d32;
        }
        
        .mapping-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .mapping-dialog {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .dialog-title {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .select-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .select-input:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        
        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .cancel-button {
          padding: 0.5rem 1rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .cancel-button:hover {
          background-color: #f5f5f5;
        }
        
        .process-button {
          padding: 0.5rem 1rem;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .process-button:hover:not(:disabled) {
          background-color: #1976d2;
        }
        
        .process-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default withAuth(InventoryPage);