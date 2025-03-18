import React, { useState, useRef } from 'react';
import { uploadExcelFile, getProductCountFromExcel, parseExcelFileEnhanced } from '../../api/excelUploadService';
import { Product } from '../../api/productService';
import DownloadTemplate from './DownloadTemplate';

interface ExcelUploadProps {
    isOpen: boolean;
    onClose: () => void;
    onProductsUploaded?: () => void;
    onUploadStart?: () => void;
    onUploadError?: () => void;
}

const ExcelUpload = ({ isOpen, onClose, onProductsUploaded, onUploadStart, onUploadError }: ExcelUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [previewData, setPreviewData] = useState<Partial<Product>[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{ row: number; field: string; message: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Check if file is an Excel file
        const validExcelTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ];
        
        if (!validExcelTypes.includes(selectedFile.type) && 
            !selectedFile.name.endsWith('.xlsx') && 
            !selectedFile.name.endsWith('.xls')) {
            setUploadError('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }
        
        // Check file size (limit to 10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
        if (selectedFile.size > MAX_FILE_SIZE) {
            setUploadError(`File size exceeds the maximum limit of 10MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB.`);
            return;
        }

        setFile(selectedFile);
        setUploadError(null);
        setUploadSuccess(null);
        setUploadProgress(0);
        setProductCount(null);
        setPreviewData([]);
        setShowPreview(false);
        setValidationErrors([]);
        
        // Analyze the Excel file to get the product count
        setIsAnalyzing(true);
        try {
            const count = await getProductCountFromExcel(selectedFile);
            setProductCount(count);
            
            // Check if there are too many products
            if (count > 500) {
                setUploadError(`Maximum of 500 products can be uploaded at once. Your file contains ${count} products. Please split your data into multiple files.`);
            } else if (count === 0) {
                setUploadError('The Excel file does not contain any products. Please check the file format and try again.');
            } else {
                // Parse the Excel file to get the preview data
                const products = await parseExcelFileEnhanced(selectedFile);
                setPreviewData(products);
                
                // Validate the data
                const errors: { row: number; field: string; message: string }[] = [];
                
                products.forEach((product, index) => {
                    if (!product.code) {
                        errors.push({ row: index + 1, field: 'code', message: 'Product code is required' });
                    }
                    if (!product.name) {
                        errors.push({ row: index + 1, field: 'name', message: 'Product name is required' });
                    }
                    if (!product.barcode) {
                        errors.push({ row: index + 1, field: 'barcode', message: 'Product barcode is required' });
                    }
                });
                
                setValidationErrors(errors);
            }
        } catch (error) {
            console.error('Error analyzing Excel file:', error);
            setUploadError('Failed to analyze Excel file. Please check the file format and try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const togglePreview = () => {
        setShowPreview(!showPreview);
    };

    const handleUpload = async () => {
        if (!file) {
            return;
        }

        setIsLoading(true);
        setUploadError(null);
        setUploadSuccess(null);
        setUploadProgress(0);
        
        // Notify parent component that upload is starting
        if (onUploadStart) {
            onUploadStart();
        }

        try {
            // Upload the Excel file directly to the server
            const uploadedProducts = await uploadExcelFile(
                file,
                (progress) => setUploadProgress(progress)
            );
            
            setUploadSuccess(`Successfully uploaded Excel file. ${uploadedProducts.length} products created/updated.`);
            
            // Reset form
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Notify parent component
            if (onProductsUploaded) {
                onProductsUploaded();
            }
        } catch (error) {
            console.error('Error uploading products:', error);
            setUploadError(`Failed to upload products: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setUploadProgress(0);
            
            // Notify parent component of error
            if (onUploadError) {
                onUploadError();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setUploadError(null);
        setUploadSuccess(null);
        setUploadProgress(0);
        setProductCount(null);
        setPreviewData([]);
        setShowPreview(false);
        setValidationErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        if (isLoading) {
            setShowConfirmClose(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setShowConfirmClose(false);
        onClose();
        
        // Notify parent component of error/cancellation
        if (onUploadError) {
            onUploadError();
        }
    };

    const cancelClose = () => {
        setShowConfirmClose(false);
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className={`bg-white rounded-lg shadow-lg p-6 ${showPreview ? 'w-[800px]' : 'w-[600px]'} max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Upload Products from Excel</h2>
                    <div className="flex items-center">
                        <button
                            onClick={() => window.open('/dashboard/products/guide', '_blank')}
                            className="text-blue-500 hover:text-blue-700 mr-4"
                            title="View Excel Upload Guide"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                {/* Confirmation Dialog */}
                {showConfirmClose && (
                    <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
                            <h3 className="text-xl font-bold mb-4">Cancel Upload?</h3>
                            <p className="mb-6">An upload is in progress. Are you sure you want to cancel?</p>
                            <div className="flex justify-end space-x-2">
                                <button 
                                    onClick={cancelClose}
                                    className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 hover:bg-gray-400"
                                >
                                    No, Continue Upload
                                </button>
                                <button 
                                    onClick={confirmClose}
                                    className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600"
                                >
                                    Yes, Cancel Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mb-6">
                    <p className="text-gray-600 mb-2">
                        Upload an Excel file with product data. The file should have the following columns:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4">
                        <li>Code (required) - Product code</li>
                        <li>Name (required) - Product name</li>
                        <li>Barcode (required) - Product barcode</li>
                        <li>Serialized (optional) - &quot;Yes&quot; or &quot;No&quot; (defaults to &quot;No&quot;)</li>
                    </ul>
                    
                    <div className="mb-4">
                        <DownloadTemplate />
                    </div>
                    
                    <div className="flex items-center mb-4">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            accept=".xlsx,.xls" 
                            className="hidden" 
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 mr-2"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Select Excel File'}
                        </button>
                        {file && (
                            <span className="text-gray-600">
                                {file.name} ({Math.round(file.size / 1024)} KB)
                            </span>
                        )}
                        {file && (
                            <button
                                type="button"
                                onClick={clearFile}
                                className="ml-2 text-red-500 hover:text-red-700"
                                disabled={isLoading}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    
                    {file && (
                        <div className="mt-2">
                            {isAnalyzing ? (
                                <p className="text-blue-600">Analyzing file...</p>
                            ) : productCount !== null ? (
                                <div>
                                    <p className={`${productCount > 500 ? 'text-red-600' : 'text-green-600'}`}>
                                        File contains {productCount} products
                                        {productCount > 500 && ' (exceeds maximum of 500)'}
                                    </p>
                                    {productCount > 0 && productCount <= 500 && (
                                        <button
                                            onClick={togglePreview}
                                            className="text-blue-600 hover:text-blue-800 underline mt-1"
                                        >
                                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                    
                    {uploadError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {uploadError}
                        </div>
                    )}
                    
                    {uploadSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {uploadSuccess}
                        </div>
                    )}
                    
                    {uploadProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}
                    
                    {/* Preview Data */}
                    {showPreview && previewData.length > 0 && (
                        <div className="mt-4 border border-gray-200 rounded-md p-4">
                            <h3 className="text-lg font-semibold mb-2">Preview ({previewData.length} products)</h3>
                            
                            {validationErrors.length > 0 && (
                                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                                    <p className="font-bold">Please fix the following errors:</p>
                                    <ul className="list-disc pl-5">
                                        {validationErrors.slice(0, 5).map((error, index) => (
                                            <li key={index}>
                                                Row {error.row}: {error.message} (field: {error.field})
                                            </li>
                                        ))}
                                        {validationErrors.length > 5 && (
                                            <li>...and {validationErrors.length - 5} more errors</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serialized</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previewData.slice(0, 10).map((product, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {product.code || (
                                                        <span className="text-red-500">Missing</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {product.name || (
                                                        <span className="text-red-500">Missing</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {product.barcode || (
                                                        <span className="text-red-500">Missing</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {product.serialized ? 'Yes' : 'No'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <p className="text-gray-500 text-sm mt-2">
                                        Showing 10 of {previewData.length} products
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={handleClose} 
                        className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 mr-2 hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleUpload} 
                        disabled={isLoading || !file || isAnalyzing || (productCount !== null && (productCount > 500 || productCount === 0)) || validationErrors.length > 0} 
                        className={`px-4 py-2 rounded-md ${
                            isLoading || !file || isAnalyzing || (productCount !== null && (productCount > 500 || productCount === 0)) || validationErrors.length > 0
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                    >
                        {isLoading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Upload Products'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExcelUpload;
