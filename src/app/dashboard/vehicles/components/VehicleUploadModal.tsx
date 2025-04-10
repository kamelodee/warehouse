'use client';

import React, { useState } from 'react';
import { uploadVehicles } from '@/app/api/vehicleService';
import { toast } from 'react-toastify';

interface VehicleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

const VehicleUploadModal: React.FC<VehicleUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'text/csv') {
        toast.error('Please upload a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadVehicles(selectedFile);
      
      // Success handling with custom message
      toast.success('Vehicles successfully uploaded');
      
      // Call the optional success callback
      onUploadSuccess?.();
      
      // Close the modal
      onClose();
    } catch (error: any) {
      // Error handling
      const errorMessage = error.message || 'Failed to upload vehicles';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Upload Vehicles</h2>
        
        <div className="mb-4">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-2">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        {uploadError && (
          <div className="mb-4 text-red-600 text-sm">
            {uploadError}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            className={`px-4 py-2 rounded ${
              selectedFile 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleUploadModal;
