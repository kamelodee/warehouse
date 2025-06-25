// shipmentService.ts - A utility service for shipment-related API operations

export interface ProductSerialNumber {
    id?: number;
    serialNumber: string;
}

export interface ShipmentStock {
    id: {
        shipmentId: number | null;
        productId: number;
    };
    quantity: number;
    quantityReceived: number | null;
    product: {
        id: number;
        code: string;
        name: string;
        category: string | null;
        serialized: boolean;
        barcodes: string[];
    };
    productSerialNumbers: ProductSerialNumber[];
    productSerialNumbersReceived: ProductSerialNumber[];
}

export interface Shipment {
    id: number;
    referenceNumber: string | null;
    type?: string;
    driverName: string | null;
    status: string | null;
    completeStatus: string | null;
    deliveryRemarks: string | null;
    vehicle: {
        id: number;
        code: string;
        identificationNumber: string | null;
    } | null;
    sourceWarehouse: {
        id: number;
        code: string;
        name: string;
        location: string;
    } | null;
    destinationWarehouse: {
        id: number;
        code: string;
        name: string;
        location: string;
    } | null;
    stocks: ShipmentStock[];
    notes?: string;
}

interface WhereCondition {
    leftHand: { value: string };
    matchMode: "EQUAL" | "LIKE" | "IN";
    rightHand: { value: any };
    operator?: "AND" | "OR";
}

interface ShipmentSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
    searchQuery?: string;
    where?: WhereCondition[];
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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
            } else {
                // If not JSON, get text
                errorMessage = await response.text() || `Error ${response.status}: ${response.statusText}`;
            }
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // If parsing fails, use status text
            errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        const error = new Error(errorMessage);
        const enhancedError = error as unknown as Record<string, unknown>;
        enhancedError.status = response.status;
        enhancedError.data = errorData;
        
        logApiError(method, endpoint, enhancedError, { status: response.status });
        throw enhancedError;
    }
    
    // Check if response is empty
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
        // Return empty object for empty responses
        return {} as T;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Unexpected content type: ${contentType}. Expected application/json.`);
        // Try to parse anyway but log warning
    }
    
    try {
        const text = await response.text();
        if (!text) {
            console.warn('Empty response body received');
            return {} as T;
        }
        return JSON.parse(text) as T;
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        logApiError(method, endpoint, enhancedError, { 
            message: 'Failed to parse JSON response',
            responseStatus: response.status,
            responseStatusText: response.statusText,
            contentType: response.headers.get('content-type')
        });
        throw new Error(`Failed to parse server response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
            } else {
                // If not JSON, get text
                errorMessage = await response.text() || `Error ${response.status}: ${response.statusText}`;
            }
        } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // If parsing fails, use status text
            errorMessage = `Error ${response.status}: ${response.statusText}`;
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
    
    // Check if response is empty
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
        return null;
    }
    
    // For responses with content, try to parse JSON
    try {
        const text = await response.text();
        if (!text) {
            // Empty response body
            return method === 'DELETE' ? null : {} as T;
        }
        return JSON.parse(text) as T;
    } catch (error) {
        const enhancedError = (error instanceof Error ? 
            { ...error, message: error.message } : 
            error) as Record<string, unknown>;
        
        // For DELETE operations, it's common to get no content even with 200 status
        if (method === 'DELETE') {
            return null;
        }
        
        logApiError(method, endpoint, enhancedError, { 
            message: 'Failed to parse JSON response',
            responseStatus: response.status,
            responseStatusText: response.statusText,
            contentType: response.headers.get('content-type')
        });
        throw new Error(`Failed to parse server response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
};

/**
 * Search for shipments with pagination and sorting
 */
export const searchShipments = async (params: ShipmentSearchParams = {}): Promise<ShipmentSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id', searchQuery, where } = params;
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
                body: JSON.stringify({
                    where: where || []
                })
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
            where,
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
