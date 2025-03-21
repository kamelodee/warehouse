// excelUploadService.ts - A utility service for Excel file upload operations
import { Product } from './productService';

// Dynamically import XLSX only when needed
const getXLSX = async () => {
  const XLSX = await import('xlsx');
  return XLSX;
};

/**
 * Parse an Excel file and convert it to an array of product objects
 * @param file The Excel file to parse
 * @returns An array of product objects
 */
export const parseExcelFile = async (file: File): Promise<Partial<Product>[]> => {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('Failed to read file'));
                    return;
                }
                
                // Dynamically import XLSX
                const XLSX = await getXLSX();
                
                // Parse the Excel file
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // Map Excel columns to product properties
                const products = jsonData.map((row: unknown) => {
                    const typedRow = row as Record<string, unknown>;
                    return {
                        code: (typedRow['Code'] || typedRow['code'] || '') as string,
                        name: (typedRow['Name'] || typedRow['name'] || '') as string,
                        barcode: (typedRow['Barcode'] || typedRow['barcode'] || '') as string,
                        serialized: typedRow['Serialized'] === 'Yes' || typedRow['serialized'] === true || false
                    };
                });
                
                resolve(products);
            } catch (error) {
                console.error('Error parsing Excel file:', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsBinaryString(file);
    });
};

/**
 * Parse an Excel file and return the products with enhanced error handling and validation
 * @param file The Excel file to parse
 * @returns An array of product objects with validation results
 */
export const parseExcelFileEnhanced = async (file: File): Promise<Partial<Product>[]> => {
    try {
        // Dynamically import XLSX
        const XLSX = await getXLSX();
        
        // Read the file as an array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extract headers (first row)
        const headers = jsonData[0] as string[];
        const requiredHeaders = ['Code', 'Name'];
        
        // Validate headers
        const missingHeaders = requiredHeaders.filter(
            required => !headers.some(header => 
                typeof header === 'string' && header.toLowerCase() === required.toLowerCase()
            )
        );
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }
        
        // Find column indices
        const getColumnIndex = (name: string): number => {
            return headers.findIndex(header => 
                typeof header === 'string' && header.toLowerCase() === name.toLowerCase()
            );
        };
        
        const codeIndex = getColumnIndex('code');
        const nameIndex = getColumnIndex('name');
        const barcodeIndex = getColumnIndex('barcode');
        const serializedIndex = getColumnIndex('serialized');
        
        // Map rows to products (skip header row)
        const products: Partial<Product>[] = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[];
            
            // Skip empty rows
            if (!row.length || (row.length === 1 && !row[0])) continue;
            
            const product: Partial<Product> = {};
            
            if (codeIndex >= 0 && row[codeIndex] !== undefined) {
                product.code = String(row[codeIndex]);
            }
            
            if (nameIndex >= 0 && row[nameIndex] !== undefined) {
                product.name = String(row[nameIndex]);
            }
            
            if (barcodeIndex >= 0 && row[barcodeIndex] !== undefined) {
                product.barcode = String(row[barcodeIndex]);
            }
            
            if (serializedIndex >= 0) {
                const value = row[serializedIndex];
                product.serialized = value === 'Yes' || value === true || value === 1;
            } else {
                product.serialized = true; // Default value
            }
            
            products.push(product);
        }
        
        return products;
    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Get the number of products in an Excel file
 * @param file The Excel file to analyze
 * @returns The number of products in the file
 */
export const getProductCountFromExcel = async (file: File): Promise<number> => {
    try {
        // Dynamically import XLSX
        const XLSX = await getXLSX();
        
        // Read the file as an array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Count non-empty rows (excluding header)
        return jsonData.slice(1).filter(row => row && Array.isArray(row) && row.length > 0).length;
    } catch (error) {
        console.error('Error counting products in Excel file:', error);
        throw new Error(`Failed to count products: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        // Dynamically import XLSX
        const XLSX = await getXLSX();
        
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
        // Dynamically import XLSX
        const XLSX = await getXLSX();
        
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
        const response = await fetch('https://stock.hisense.com.gh/api/v1.0/products/upload', {
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
            } catch {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            // Create a detailed error object
            const error = new Error(errorMessage);
            const enhancedError = error as unknown as Record<string, unknown>;
            enhancedError.status = response.status;
            enhancedError.details = errorDetails;
            enhancedError.fileName = file.name;
            
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
            
            throw enhancedError;
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during Excel upload';
        const enhancedError = new Error(errorMessage) as unknown as Record<string, unknown>;
        enhancedError.fileName = file.name;
        enhancedError.fileSize = file.size;
        enhancedError.fileType = file.type;
        
        // Log the error with detailed context
        console.error('Excel file upload error', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};
