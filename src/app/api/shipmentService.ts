// shipmentService.ts - A utility service for shipment-related API operations

export interface ProductSerialNumber {
    id?: number;
    serialNumber: string;
}

export interface ShipmentStock {
    quantity: number;
    quantityReceived?: number;
    productId: number;
    productSerialNumbers?: ProductSerialNumber[];
}

export interface Shipment {
    id?: number;
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    driverName: string;
    vehicleId: number;
    stocks: ShipmentStock[];
    reference?: string;
    type?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    notes?: string;
}

interface ShipmentSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
}

interface ShipmentSearchResponse {
    content: Shipment[];
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
 * Search for shipments with pagination and sorting
 */
export const searchShipments = async (params: ShipmentSearchParams = {}): Promise<ShipmentSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id' } = params;
    const token = getToken();
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('POST', '/shipments/search', error);
        throw error;
    }
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/shipments/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({})
            }
        );
        
        return handleResponse<ShipmentSearchResponse>(response, 'POST', '/shipments/search');
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            // Only log network or other errors not already logged by handleResponse
            logApiError('POST', '/shipments/search', error, { params });
        }
        throw error;
    }
};

/**
 * Get a shipment by ID
 */
export const getShipment = async (id: number): Promise<Shipment> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
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
        
        return handleResponse<Shipment>(response, 'GET', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('GET', endpoint, error);
        }
        throw error;
    }
};

/**
 * Create a new shipment
 */
export const createShipment = async (shipment: Shipment): Promise<Shipment> => {
    const token = getToken();
    const endpoint = '/shipments';
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('POST', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(shipment)
        });
        
        return handleResponse<Shipment>(response, 'POST', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('POST', endpoint, error, { shipmentData: shipment });
        }
        throw error;
    }
};

/**
 * Update an existing shipment
 */
export const updateShipment = async (id: number, shipment: Shipment): Promise<Shipment> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('PUT', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(shipment)
        });
        
        return handleResponse<Shipment>(response, 'PUT', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('PUT', endpoint, error, { shipmentData: shipment });
        }
        throw error;
    }
};

/**
 * Delete a shipment by ID
 */
export const deleteShipment = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/shipments/${id}`;
    
    if (!token) {
        const error = new Error('Authentication token not found');
        logApiError('DELETE', endpoint, error);
        throw error;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        // For DELETE operations, we don't expect content in the response
        await handleResponseWithPossibleNoContent<void>(response, 'DELETE', endpoint);
    } catch (error) {
        if (!(error instanceof Error && (error as any).status)) {
            logApiError('DELETE', endpoint, error);
        }
        throw error;
    }
};

export default {
    searchShipments,
    getShipment,
    createShipment,
    updateShipment,
    deleteShipment
};
