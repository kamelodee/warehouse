// shipmentService.ts - A utility service for shipment-related API operations

export interface ProductSerialNumber {
    id?: number;
    serialNumber: string;
}

export interface ShipmentStock {
    quantity: number;
    quantityReceived: number;
    productId: number;
    productSerialNumbers: ProductSerialNumber[];
    productSerialNumbersReceived: ProductSerialNumber[];
}

export interface Shipment {
    referenceNumber: string;
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    driverName: string;
    vehicleId: number;
    stocks: ShipmentStock[];
    type?: string;
    status?: string;
    notes?: string;
    id?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface ShipmentSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
    searchQuery?: string;
}

interface ShipmentSearchResponse {
    content: Shipment[];
    totalPages: number;
    totalElements: number;
}

const API_BASE_URL = 'https://stock.hisense.com.gh/api/v1.0';

/**
 * Get the authentication token from session storage
 */
const getToken = (): string | null => {
    return localStorage.getItem('accessToken');
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
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch (_textError) { // eslint-disable-line @typescript-eslint/no-unused-vars
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
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
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch (_textError) { // eslint-disable-line @typescript-eslint/no-unused-vars
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
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
        throw new Error('Failed to parse server response');
    }
};

/**
 * Search for shipments with pagination and sorting
 */
export const searchShipments = async (params: ShipmentSearchParams = {}): Promise<ShipmentSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id', searchQuery } = params;
    const token = getToken();
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('POST', '/shipments/search', enhancedError);
        throw enhancedError;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/shipments/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}${searchQuery ? `&searchQuery=${searchQuery}` : ''}`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({})
            }
        );
        
        return handleResponse<ShipmentSearchResponse>(response, 'POST', '/shipments/search');
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('POST', '/shipments/search', enhancedError, {
            page,
            size,
            sort,
            sortField,
            searchQuery,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Get a shipment by ID
 */
export const getShipment = async (id: number): Promise<Shipment> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
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
        
        return handleResponse<Shipment>(response, 'GET', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('GET', endpoint, enhancedError);
        throw enhancedError;
    }
};

/**
 * Create a new shipment
 */
export const createShipment = async (shipment: Shipment): Promise<Shipment> => {
    const token = getToken();
    const endpoint = '/shipments';
    
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
            body: JSON.stringify(shipment)
        });
        
        return handleResponse<Shipment>(response, 'POST', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('POST', endpoint, enhancedError, { 
            shipmentData: shipment,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Update an existing shipment
 */
export const updateShipment = async (id: number, shipment: Shipment): Promise<Shipment> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
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
            body: JSON.stringify(shipment)
        });
        
        return handleResponse<Shipment>(response, 'PUT', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('PUT', endpoint, enhancedError, { 
            shipmentId: id,
            shipmentData: shipment,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

/**
 * Delete a shipment by ID
 */
export const deleteShipment = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
    if (!token) {
        const errorMessage = 'Authentication token not found';
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        
        logApiError('DELETE', endpoint, enhancedError);
        throw enhancedError;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        // For DELETE operations, we don't expect content in the response
        await handleResponseWithPossibleNoContent<void>(response, 'DELETE', endpoint);
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError('DELETE', endpoint, enhancedError, {
            shipmentId: id,
            timestamp: new Date().toISOString()
        });
        
        throw enhancedError;
    }
};

// Create a named export object to avoid anonymous default export
const shipmentService = {
    searchShipments,
    getShipment,
    createShipment,
    updateShipment,
    deleteShipment
};

export default shipmentService;
