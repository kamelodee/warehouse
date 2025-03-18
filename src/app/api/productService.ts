// productService.ts - A utility service for product-related API operations

export interface Product {
    id?: number;
    code: string;
    name: string;
    barcode: string;
    serialized: boolean;
    imageUrl?: string;
}

interface ProductSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
}

interface ProductSearchResponse {
    content: Product[];
    totalPages: number;
    totalElements: number;
}

const API_BASE_URL = 'http://stock.hisense.com.gh/api/v1.0';

/**
 * Get the authentication token from session storage
 */
const getToken = (): string | null => {
    return sessionStorage.getItem('accessToken');
};

/**
 * Create common headers with authentication
 */
const getHeaders = (): HeadersInit => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/**
 * Log API errors with detailed information
 */
const logApiError = (method: string, endpoint: string, error: any, additionalInfo?: any) => {
    console.error(`API Error [${method} ${endpoint}]:`, {
        message: error.message || 'Unknown error',
        status: error.status,
        additionalInfo,
        timestamp: new Date().toISOString()
    });
};

/**
 * Handle API response and error
 */
const handleResponse = async <T>(response: Response, method: string, endpoint: string): Promise<T> => {
    if (!response.ok) {
        let errorMessage = 'Unknown error occurred';
        let errorData = null;
        
        try {
            // Try to parse error response as JSON
            errorData = await response.json();
            errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (e) {
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch (textError) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        logApiError(method, endpoint, error, { status: response.status });
        throw error;
    }
    
    try {
        return await response.json() as T;
    } catch (error) {
        logApiError(method, endpoint, error, { message: 'Failed to parse JSON response' });
        throw new Error('Failed to parse server response');
    }
};

/**
 * Handle API response for operations that may return no content
 */
const handleResponseWithPossibleNoContent = async <T>(response: Response, method: string, endpoint: string): Promise<T | null> => {
    if (!response.ok) {
        let errorMessage = 'Unknown error occurred';
        let errorData = null;
        
        try {
            // Try to parse error response as JSON
            errorData = await response.json();
            errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
        } catch (e) {
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch (textError) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        logApiError(method, endpoint, error, { status: response.status });
        throw error;
    }
    
    // For 204 No Content responses, return null
    if (response.status === 204) {
        return null;
    }
    
    // For responses with content, try to parse JSON
    try {
        return await response.json() as T;
    } catch (error) {
        // For DELETE operations, it's common to get no content even with 200 status
        if (method === 'DELETE') {
            return null;
        }
        
        logApiError(method, endpoint, error, { message: 'Failed to parse JSON response' });
        throw new Error('Failed to parse server response');
    }
};

/**
 * Search for products with pagination and sorting
 */
export const searchProducts = async (params: ProductSearchParams = {}): Promise<ProductSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id' } = params;
    const token = getToken();
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('POST', '/products/search', error);
        throw error;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/products/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({})
            }
        );
        
        return handleResponse<ProductSearchResponse>(response, 'POST', '/products/search');
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            // Only log network or other errors not already logged by handleResponse
            logApiError('POST', '/products/search', error, { params });
        }
        throw error;
    }
};

/**
 * Get a product by ID
 */
export const getProduct = async (id: number): Promise<Product> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('GET', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        
        return handleResponse<Product>(response, 'GET', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('GET', endpoint, error);
        }
        throw error;
    }
};

/**
 * Create a new product
 */
export const createProduct = async (product: Product): Promise<Product> => {
    const token = getToken();
    const endpoint = '/products';
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('POST', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        
        return handleResponse<Product>(response, 'POST', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('POST', endpoint, error, { productData: product });
        }
        throw error;
    }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: number, product: Product): Promise<Product> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('PUT', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        
        return handleResponse<Product>(response, 'PUT', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('PUT', endpoint, error, { productData: product });
        }
        throw error;
    }
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('DELETE', endpoint, error);
        throw error;
    }
    
    try {
        // Log the delete operation for audit purposes
        console.info(`Attempting to delete product with ID: ${id} at ${new Date().toISOString()}`);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        // Use the handler that can handle no content responses
        await handleResponseWithPossibleNoContent(response, 'DELETE', endpoint);
        
        // Log successful deletion
        console.info(`Successfully deleted product with ID: ${id} at ${new Date().toISOString()}`);
    } catch (error) {
        // Enhance error with additional context
        const enhancedError = error instanceof Error 
            ? error 
            : new Error('Unknown error during product deletion');
            
        if (!(enhancedError as any).status) {
            (enhancedError as any).status = 500;
        }
        
        // Add operation context to the error
        (enhancedError as any).operation = 'deleteProduct';
        (enhancedError as any).productId = id;
        
        // Log the error with detailed information
        logApiError('DELETE', endpoint, enhancedError, { 
            productId: id,
            timestamp: new Date().toISOString(),
            attemptDetails: 'Product deletion operation failed'
        });
        
        // Rethrow with enhanced information
        throw enhancedError;
    }
};

/**
 * Create multiple products at once
 * @param products Array of product objects to create
 * @returns Array of created products
 */
export const createBatchProducts = async (products: Partial<Product>[]): Promise<Product[]> => {
    const token = sessionStorage.getItem('accessToken');
    
    if (!token) {
        throw new Error('Authentication token not found');
    }
    
    try {
        // Log the creation attempt
        console.info(`Attempting to create ${products.length} products in batch at ${new Date().toISOString()}`);
        
        // Send the request to the API
        const response = await fetch('http://stock.hisense.com.gh/api/v1.0/products/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(products)
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to create products';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Log successful creation
        console.info(`Successfully created ${data.length} products in batch`);
        
        return data;
    } catch (error) {
        // Log the error
        console.error('Product batch creation error:', {
            productsCount: products.length,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
        
        throw error;
    }
};
