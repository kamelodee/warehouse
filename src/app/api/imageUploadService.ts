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
        throw new Error('Authentication token not found');
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
        const response = await fetch('http://stock.hisense.com.gh/api/v1.0/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to upload image';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Log successful upload
        console.info(`Successfully uploaded image: ${file.name}, received URL: ${data.url}`);
        
        return data.url;
    } catch (error) {
        // Log the error
        console.error('Image upload error:', {
            fileName: file.name,
            fileSize: file.size,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
        
        throw error;
    }
};
