import React, { useState, useRef } from 'react';
import { uploadProductsFile } from '../../api/productService';

interface ProductUploadProps {
  onUploadSuccess?: () => void;
  onUploadError?: () => void;
}

const ProductUpload: React.FC<ProductUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    try {
      await uploadProductsFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess('Products uploaded successfully');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Error uploading products:', error);
      setUploadError(`Failed to upload products: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onUploadError) {
        onUploadError();
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx,.xls,.csv"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Prices'}
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className="absolute left-0 -bottom-2 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="absolute left-0 top-full mt-2 bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs">
          {uploadError}
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <div className="absolute left-0 top-full mt-2 bg-green-100 border border-green-400 text-green-700 px-2 py-1 rounded text-xs">
          {uploadSuccess}
        </div>
      )}
    </div>
  );
};

export default ProductUpload;
