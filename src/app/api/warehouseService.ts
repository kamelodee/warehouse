// warehouseService.ts - A utility service for warehouse-related API operations

export interface Warehouse {
    id: number;
    name: string;
    location?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface WarehouseSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
}

interface WarehouseSearchResponse {
    content: Warehouse[];
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
 * Search for warehouses with pagination and sorting
 */
export const searchWarehouses = async (params: WarehouseSearchParams = {}): Promise<WarehouseSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id' } = params;
    const token = getToken();
    const endpoint = `/warehouses/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({})
        });
        
        return handleResponse<WarehouseSearchResponse>(response, 'POST', endpoint);
    } catch (error) {
        logApiError('POST', endpoint, error);
        throw error;
    }
};

/**
 * Get a warehouse by ID
 */
export const getWarehouse = async (id: number): Promise<Warehouse> => {
    const token = getToken();
    const endpoint = `/warehouses/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        
        return handleResponse<Warehouse>(response, 'GET', endpoint);
    } catch (error) {
        logApiError('GET', endpoint, error);
        throw error;
    }
};

/**
 * Create a new warehouse
 */
export const createWarehouse = async (warehouse: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> => {
    const token = getToken();
    const endpoint = '/warehouses';
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(warehouse)
        });
        
        return handleResponse<Warehouse>(response, 'POST', endpoint);
    } catch (error) {
        logApiError('POST', endpoint, error, { warehouseData: warehouse });
        throw error;
    }
};

/**
 * Update an existing warehouse
 */
export const updateWarehouse = async (id: number, warehouse: Partial<Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Warehouse> => {
    const token = getToken();
    const endpoint = `/warehouses/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(warehouse)
        });
        
        return handleResponse<Warehouse>(response, 'PUT', endpoint);
    } catch (error) {
        logApiError('PUT', endpoint, error, { warehouseId: id, warehouseData: warehouse });
        throw error;
    }
};

/**
 * Delete a warehouse by ID
 */
export const deleteWarehouse = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/warehouses/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            await handleResponse<any>(response, 'DELETE', endpoint);
        }
    } catch (error) {
        logApiError('DELETE', endpoint, error, { warehouseId: id });
        throw error;
    }
};
