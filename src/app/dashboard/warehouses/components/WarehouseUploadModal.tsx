'use client';

import React, { useState, useRef } from 'react';
import { uploadWarehouses } from '@/app/api/warehouseService';
import { toast } from 'react-toastify';

interface WarehouseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WarehouseUploadModal({ 
  isOpen, 
  onClose,
  onSuccess 
}: WarehouseUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'text/csv' && file.name.toLowerCase().indexOf('.csv') === -1) {
        toast.error('Please upload a CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);

    try {
      await uploadWarehouses(selectedFile);
      
      toast.success('Warehouses uploaded successfully');
      onSuccess?.();
      onClose();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload warehouses');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Upload Warehouses</h2>
        
        <div className="mb-4">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
