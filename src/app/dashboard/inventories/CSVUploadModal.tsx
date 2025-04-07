'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  uploadInventoryCSV, 
  processInventoryCSV
} from '@/app/api/inventoryService';
import { searchProducts, Product } from '@/app/api/productService';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVHeader {
  value: string;
  label: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileId, setFileId] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([] as Product[]);
  const [error, setError] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Mapping selections
  const [serialNumberColumn, setSerialNumberColumn] = useState<string>('');
  const [batchNumberColumn, setBatchNumberColumn] = useState<string>('');
  const [containerNumberColumn, setContainerNumberColumn] = useState<string>('');
  const [blNumberColumn, setBlNumberColumn] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal is opened/closed
  React.useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setUploading(false);
      setProcessing(false);
      setFileId('');
      setHeaders([]);
      setError('');
      setSerialNumberColumn('');
      setBatchNumberColumn('');
      setContainerNumberColumn('');
      setBlNumberColumn('');
      setSelectedProduct('');

      // Fetch products
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setError('');
      setLoadingProducts(true);
      console.log('Fetching products...');
      
      // Use the searchProducts function with larger page size for the dropdown
      const productsData = await searchProducts({
        page: 0,
        size: 500, // Get more products to show in the dropdown
        sort: 'ASC',
        sortField: 'name' // Sort by name for better usability
      });
      
      if (productsData && productsData.content && productsData.content.length > 0) {
        console.log(`Successfully loaded ${productsData.content.length} products`);
        setProducts(productsData.content);
      } else {
        console.warn('No products returned from API');
        setProducts([]);
        setError('No products available. Please create products first.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading CSV file...');
      const response = await uploadInventoryCSV(formData);
      
      console.log('Upload response:', response);
      
      if (response && response.fileId && response.headers) {
        // Store fileId as a number
        setFileId(response.fileId.toString());
        setHeaders(response.headers);
        setStep('mapping');
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('Failed to upload CSV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!serialNumberColumn) {
      setError('Please select a column for Serial Number');
      return;
    }

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create a clean mapping data object with proper string values
      const mappingData = {
        fileId: parseInt(fileId), // Convert fileId to a number
        serialNumberHeaderName: serialNumberColumn || '',
        batchNumberHeaderName: batchNumberColumn || '',
        containerNumberHeaderName: containerNumberColumn || '',
        blHeaderName: blNumberColumn || '',
      };

      console.log('Processing CSV with mapping:', mappingData);
      
      // Convert product ID to string if needed by the API
      const productId = parseInt(selectedProduct);
      await processInventoryCSV(productId, mappingData);
      
      console.log('CSV processed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing CSV mapping:', error);
      setError('Failed to process CSV mapping. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'upload' ? 'Upload Inventory CSV' : 'Map CSV Columns'}
          </h2>
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {step === 'upload' ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2"
                >
                  Choose File
                </button>
                <span className="text-sm text-gray-500 truncate">
                  {file ? file.name : 'No file selected'}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-4 py-2 rounded-md ${
                  !file || uploading
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Serial Number Column
              </label>
              <select
                value={serialNumberColumn}
                onChange={(e) => setSerialNumberColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a column</option>
                {headers.map((header) => (
                  <option key={`serial-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Batch Number Column
              </label>
              <select
                value={batchNumberColumn}
                onChange={(e) => setBatchNumberColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a column</option>
                {headers.map((header) => (
                  <option key={`batch-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Container Number Column
              </label>
              <select
                value={containerNumberColumn}
                onChange={(e) => setContainerNumberColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a column</option>
                {headers.map((header) => (
                  <option key={`container-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select BL Number Column
              </label>
              <select
                value={blNumberColumn}
                onChange={(e) => setBlNumberColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a column</option>
                {headers.map((header) => (
                  <option key={`bl-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full p-2 border border-gray-300 text-zinc-800 rounded-md"
              >
                <option value="">Select a product</option>
                {loadingProducts ? (
                  <option>Loading...</option>
                ) : products.length === 0 ? (
                  <option>No products available</option>
                ) : (
                  products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.code ? `(${product.code})` : ''}
                    </option>
                  ))
                )}
              </select>
              {loadingProducts && (
                <div className="mt-1 text-sm text-indigo-600">Loading products...</div>
              )}
              {!loadingProducts && products.length === 0 && (
                <div className="mt-1 text-sm text-red-500">No products available. Please create products first.</div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 mr-2"
              >
                Back
              </button>
              <button
                onClick={handleProcess}
                disabled={
                  !serialNumberColumn ||
                  !selectedProduct ||
                  !batchNumberColumn ||
                  !containerNumberColumn ||
                  !blNumberColumn ||
                  processing
                }
                className={`px-4 py-2 rounded-md ${
                  !serialNumberColumn ||
                  !selectedProduct ||
                  !batchNumberColumn ||
                  !containerNumberColumn ||
                  !blNumberColumn ||
                  processing
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {processing ? 'Processing...' : 'Process'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUploadModal;
