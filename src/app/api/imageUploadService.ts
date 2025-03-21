// imageUploadService.ts - A utility service for image upload operations

/**
 * Upload an image to the server
 * @param file The file to upload
 * @param productId Optional product ID to associate with the image
 * @returns The URL of the uploaded image
 */
export const uploadImage = async (file: File, productId?: number): Promise<string> => {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        
        // Log the error
        console.error('Image upload authentication error:', {
            message: errorMessage,
            timestamp: new Date().toISOString()
        });
        
        throw error;
    }
    
    try {
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', file);
        
        if (productId) {
            formData.append('productId', productId.toString());
        }
        
        // Log the upload attempt
        console.info(`Attempting to upload image: ${file.name} (${file.size} bytes) at ${new Date().toISOString()}`);
        
        // Send the request to the API
        const response = await fetch('https://stock.hisense.com.gh/api/v1.0/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to upload image';
            let errorData: Record<string, unknown> = {};
            
            try {
                // Try to parse error response as JSON
                errorData = await response.json();
                errorMessage = (errorData.message as string) || `Error ${response.status}: ${response.statusText}`;
            } catch {
                // If not JSON, get text
                try {
                    errorMessage = await response.text();
                } catch {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
            }
            
            const error = new Error(errorMessage);
            const enhancedError = error as unknown as Record<string, unknown>;
            enhancedError.status = response.status;
            enhancedError.data = errorData;
            
            throw enhancedError;
        }
        
        const data = await response.json();
        
        // Log successful upload
        console.info(`Successfully uploaded image: ${file.name}, received URL: ${data.url}`);
        
        return data.url;
    } catch (error) {
        // Convert error to a properly typed object
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
            
        // Log the error
        console.error('Image upload error:', {
            fileName: file.name,
            fileSize: file.size,
            error: enhancedError.message || 'Unknown error',
            status: 'status' in enhancedError ? enhancedError.status : undefined,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};
