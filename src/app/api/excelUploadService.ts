// excelUploadService.ts - A utility service for Excel file upload operations
import * as XLSX from 'xlsx';
import { Product } from './productService';

/**
 * Parse an Excel file and convert it to an array of product objects
 * @param file The Excel file to parse
 * @returns An array of product objects
 */
export const parseExcelFile = (file: File): Promise<Partial<Product>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('Failed to read file'));
                    return;
                }
                
                // Parse the Excel file
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // Map Excel columns to product properties
                const products = jsonData.map((row: any) => {
                    return {
                        code: row['Code'] || row['code'] || '',
                        name: row['Name'] || row['name'] || '',
                        barcode: row['Barcode'] || row['barcode'] || '',
                        serialized: row['Serialized'] === 'Yes' || row['serialized'] === true || false
                    };
                });
                
                resolve(products);
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        // Read the file as binary
        reader.readAsBinaryString(file);
    });
};

/**
 * Parse an Excel file and return the products with enhanced error handling
 * @param file The Excel file to parse
 * @returns Array of products from the Excel file
 */
export const parseExcelFileEnhanced = async (file: File): Promise<Partial<Product>[]> => {
    try {
        // Read the file as an array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Map the data to products
        const products: Partial<Product>[] = data.map((row) => {
            // Handle different possible column names (case insensitive)
            const code = row.Code || row.code || row.CODE || '';
            const name = row.Name || row.name || row.NAME || '';
            const barcode = row.Barcode || row.barcode || row.BARCODE || '';
            
            // Handle serialized field (can be "Yes"/"No", "TRUE"/"FALSE", true/false, 1/0)
            let serialized = false;
            const serializedValue = row.Serialized || row.serialized || row.SERIALIZED;
            if (serializedValue !== undefined) {
                if (typeof serializedValue === 'boolean') {
                    serialized = serializedValue;
                } else if (typeof serializedValue === 'number') {
                    serialized = serializedValue === 1;
                } else if (typeof serializedValue === 'string') {
                    const value = serializedValue.toLowerCase();
                    serialized = value === 'yes' || value === 'true' || value === '1';
                }
            }
            
            return {
                code,
                name,
                barcode,
                serialized
            };
        });
        
        return products;
    } catch (error) {
        console.error('Error parsing Excel file', {
            fileName: file.name,
            fileSize: file.size,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
        
        throw new Error('Failed to parse Excel file');
    }
};

/**
 * Get the number of products in an Excel file
 * @param file The Excel file to analyze
 * @returns The number of products in the file
 */
export const getProductCountFromExcel = async (file: File): Promise<number> => {
    try {
        // Parse the Excel file
        const products = await parseExcelFileEnhanced(file);
        return products.length;
    } catch (error) {
        console.error('Error counting products in Excel file:', error);
        throw error;
    }
};

/**
 * Upload multiple products to the server
 * @param products Array of product objects to upload
 * @param onProgress Optional callback for progress updates
 * @returns Array of created products
 */
export const uploadProducts = async (
    products: Partial<Product>[],
    onProgress?: (progress: number) => void
): Promise<Partial<Product>[]> => {
    try {
        // Log the upload attempt
        console.info(`Attempting to upload ${products.length} products from Excel at ${new Date().toISOString()}`);
        
        // Simulate progress updates if callback is provided
        if (onProgress) {
            // Start progress at 10%
            onProgress(10);
            
            // Update progress to 50% after a short delay
            setTimeout(() => onProgress(50), 500);
        }
        
        // Use the batch creation function from productService
        // Removed unused code
        
        // Complete progress
        if (onProgress) {
            onProgress(100);
        }
        
        // Log successful upload
        console.info(`Successfully uploaded ${products.length} products from Excel`);
        
        return products;
    } catch (error) {
        // Log the error
        console.error('Product batch upload error:', {
            productsCount: products.length,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
        
        throw error;
    }
};

/**
 * Upload an Excel file directly to the server
 * @param file The Excel file to upload
 * @param onProgress Optional callback for progress updates
 * @returns Array of created products
 */
export const uploadExcelFile = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<Product[]> => {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
        const error = new Error('Authentication token not found');
        console.error('Excel upload error: Authentication token missing', {
            timestamp: new Date().toISOString(),
            fileName: file.name,
            fileSize: file.size
        });
        throw error;
    }
    
    try {
        // Log the upload attempt with detailed information
        console.info('Excel upload attempt', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString()
        });
        
        // Start progress at 10% if callback is provided
        if (onProgress) {
            onProgress(10);
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Update progress to 30% after preparing the form data
        if (onProgress) {
            onProgress(30);
        }
        
        // Send the request to the API
        const response = await fetch('http://stock.hisense.com.gh/api/v1.0/products/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        // Update progress to 70% after sending the request
        if (onProgress) {
            onProgress(70);
        }
        
        if (!response.ok) {
            let errorMessage = 'Failed to upload Excel file';
            let errorDetails = {};
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
                errorDetails = errorData;
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            // Create a detailed error object
            const error = new Error(errorMessage);
            
            // Log the error with context
            console.error('Excel upload API error', {
                fileName: file.name,
                fileSize: file.size,
                status: response.status,
                statusText: response.statusText,
                errorMessage,
                errorDetails,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
        
        const data = await response.json();
        
        // Complete progress
        if (onProgress) {
            onProgress(100);
        }
        
        // Log successful upload with detailed information
        console.info('Excel upload success', {
            fileName: file.name,
            fileSize: file.size,
            productsCount: data.length,
            timestamp: new Date().toISOString()
        });
        
        return data;
    } catch (error) {
        // Create an enhanced error with context
        const enhancedError = error instanceof Error ? error : new Error('Unknown error during Excel upload');
        
        // Log the error with detailed context
        console.error('Excel file upload error', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: enhancedError.message,
            stack: enhancedError.stack,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};
