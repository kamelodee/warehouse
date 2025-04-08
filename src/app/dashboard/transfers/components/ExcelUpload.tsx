'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { getAccessToken } from '@/app/utils/tokenService';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload an Excel or CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    
    try {
      const token = getAccessToken();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transfers/upload`, 
        formData, 
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token || ''}`
          }
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Upload failed' 
        : 'An unexpected error occurred';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Upload Transfers</h2>
        
        <div className="mb-4">
          <label 
            htmlFor="excelUpload" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload Excel/CSV File
          </label>
          <input
            type="file"
            id="excelUpload"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              Selected file: {file.name}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;
