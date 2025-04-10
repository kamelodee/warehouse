"use client";

import React, { useState } from 'react';
import { uploadTransfers } from '@/app/api/transferService';

interface TransferUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ApiErrorResponse {
  status: string;
  timestamp: string;
  message: string;
  debugMessage?: string | null;
  subErrors?: any[] | null;
}

const TransferUploadModal: React.FC<TransferUploadModalProps> = ({ 
  onClose, 
  onSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'text/csv') {
        setError('Please upload a CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await uploadTransfers(selectedFile);
      onSuccess();
      onClose();
    } catch (err) {
      // Check if the error is an API error response
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      const errorData = apiError.response?.data;

      if (errorData) {
        // Use the specific error message from the API
        setError(errorData.message || 'Failed to upload transfers');
      } else {
        // Fallback to a generic error message
        setError('Failed to upload transfers. Please check the file and try again.');
      }

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900 p-4">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Upload Transfers</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label 
              htmlFor="transfer-upload" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload CSV File
            </label>
            <input 
              type="file" 
              id="transfer-upload"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only CSV files are allowed. Ensure the file follows the correct format.
            </p>
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm">
                Selected File: <span className="font-semibold">{selectedFile.name}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className={`px-4 py-2 rounded ${
                !selectedFile || loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferUploadModal;
