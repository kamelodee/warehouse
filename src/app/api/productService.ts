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
const logApiError = (
    method: string, 
    endpoint: string, 
    error: Record<string, unknown>, 
    additionalInfo?: Record<string, unknown>
) => {
    console.error(`API Error [${method} ${endpoint}]:`, {
        message: error.message || 'Unknown error',
        status: 'status' in error ? error.status : undefined,
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
        } catch {
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
        // Add custom properties to the error object
        const enhancedError = error as unknown as Record<string, unknown>;
        enhancedError.status = response.status;
        enhancedError.data = errorData;
        
        logApiError(method, endpoint, enhancedError, { status: response.status });
        throw enhancedError;
    }
    
    try {
        return await response.json() as T;
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError(method, endpoint, enhancedError, { message: 'Failed to parse JSON response' });
        throw enhancedError;
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
        } catch {
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
        // Add custom properties to the error object
        const enhancedError = error as unknown as Record<string, unknown>;
        enhancedError.status = response.status;
        enhancedError.data = errorData;
        
        logApiError(method, endpoint, enhancedError, { status: response.status });
        throw enhancedError;
    }
    
    // For 204 No Content responses, return null
    if (response.status === 204) {
        return null;
    }
    
    // For responses with content, try to parse JSON
    try {
        return await response.json() as T;
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        // For DELETE operations, it's common to get no content even with 200 status
        if (method === 'DELETE') {
            return null;
        }
        
        logApiError(method, endpoint, enhancedError, { message: 'Failed to parse JSON response' });
        throw enhancedError;
    }
};

/**
 * Search for products with pagination and sorting
 */
export const searchProducts = async (params: ProductSearchParams = {}): Promise<ProductSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id' } = params;
    const token = getToken();
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('POST', '/products/search', enhancedError, { params });
        throw enhancedError;
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
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('POST', '/products/search', enhancedError, {
            page,
            size,
            sort,
            sortField,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Get a product by ID
 */
export const getProduct = async (id: number): Promise<Product> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('GET', endpoint, enhancedError);
        throw enhancedError;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        
        return handleResponse<Product>(response, 'GET', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('GET', endpoint, enhancedError, {
            productId: id,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Create a new product
 */
export const createProduct = async (product: Product): Promise<Product> => {
    const token = getToken();
    const endpoint = '/products';
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('POST', endpoint, enhancedError);
        throw enhancedError;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        
        return handleResponse<Product>(response, 'POST', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('POST', endpoint, enhancedError, {
            productData: product,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: number, product: Product): Promise<Product> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('PUT', endpoint, enhancedError);
        throw enhancedError;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        
        return handleResponse<Product>(response, 'PUT', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('PUT', endpoint, enhancedError, {
            productId: id,
            productData: product,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/products/${id}`;
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('DELETE', endpoint, enhancedError);
        throw enhancedError;
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
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('DELETE', endpoint, enhancedError, {
            productId: id,
            timestamp: new Date().toISOString()
        });
        
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
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('POST', '/products/batch', enhancedError);
        throw enhancedError;
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
            } catch {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            const error = new Error(errorMessage);
            const enhancedError = error as unknown as Record<string, unknown>;
            enhancedError.status = response.status;
            
            logApiError('POST', '/products/batch', enhancedError, {
                productsCount: products.length,
                timestamp: new Date().toISOString()
            });
            
            throw enhancedError;
        }
        
        const data = await response.json();
        
        // Log successful creation
        console.info(`Successfully created ${data.length} products in batch`);
        
        return data;
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('POST', '/products/batch', enhancedError, {
            productsCount: products.length,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};
