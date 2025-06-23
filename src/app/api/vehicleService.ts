// vehicleService.ts - A utility service for vehicle-related API operations
import axios from 'axios';

export interface Vehicle {
    id?: number;
    code: string;
    identificationNumber: string;
}

interface VehicleSearchParams {
    page?: number;
    size?: number;
    sort?: string;
    sortField?: string;
}

interface VehicleSearchResponse {
    content: Vehicle[];
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
const logApiError = (method: string, endpoint: string, error: unknown, additionalInfo?: Record<string, unknown>) => {
    console.error(`API Error [${method} ${endpoint}]:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: error instanceof Error && 'status' in error ? 
            (error as Record<string, unknown>).status : 
            undefined,
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
        let errorData: unknown = null;
        
        try {
            // Try to parse error response as JSON
            errorData = await response.json();
            errorMessage = errorData && typeof errorData === 'object' && 'message' in errorData 
                ? String(errorData.message) 
                : `Error ${response.status}: ${response.statusText}`;
        } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // If not JSON, get text
            try {
                errorMessage = await response.text();
            } catch (_textError) { // eslint-disable-line @typescript-eslint/no-unused-vars
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
        }
        
        const error = new Error(errorMessage);
        (error as Error & { status: number; data: unknown }).status = response.status;
        (error as Error & { status: number; data: unknown }).data = errorData;
        
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
 * Search for vehicles with pagination and sorting
 */
export const searchVehicles = async (params: VehicleSearchParams = {}): Promise<VehicleSearchResponse> => {
    const { page = 0, size = 10, sort = 'ASC', sortField = 'id' } = params;
    const token = getToken();
    const endpoint = `/vehicles/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({})
        });
        
        return handleResponse<VehicleSearchResponse>(response, 'POST', endpoint);
    } catch (error) {
        logApiError('POST', endpoint, error);
        throw error;
    }
};

/**
 * Get a vehicle by ID
 */
export const getVehicle = async (id: number): Promise<Vehicle> => {
    const token = getToken();
    const endpoint = `/vehicles/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        
        return handleResponse<Vehicle>(response, 'GET', endpoint);
    } catch (error) {
        logApiError('GET', endpoint, error);
        throw error;
    }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const token = getToken();
    const endpoint = '/vehicles';
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(vehicle)
        });
        
        return handleResponse<Vehicle>(response, 'POST', endpoint);
    } catch (error) {
        logApiError('POST', endpoint, error, { vehicleData: vehicle });
        throw error;
    }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (id: number, vehicle: Partial<Omit<Vehicle, 'id'>>): Promise<Vehicle> => {
    const token = getToken();
    const endpoint = `/vehicles/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(vehicle)
        });
        
        return handleResponse<Vehicle>(response, 'PUT', endpoint);
    } catch (error) {
        logApiError('PUT', endpoint, error, { vehicleId: id, vehicleData: vehicle });
        throw error;
    }
};

/**
 * Delete a vehicle by ID
 */
export const deleteVehicle = async (id: number): Promise<void> => {
    const token = getToken();
    const endpoint = `/vehicles/${id}`;
    
    if (!token) {
        throw new Error('Authentication token is missing');
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!response.ok) {
            await handleResponse<void>(response, 'DELETE', endpoint);
        }
    } catch (error) {
        logApiError('DELETE', endpoint, error, { vehicleId: id });
        throw error;
    }
};

/**
 * Upload vehicles from a file
 */
export const uploadVehicles = async (file: File): Promise<any> => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/vehicles/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Content-Type is automatically set by the browser when using FormData
            },
            body: formData
        });

        return handleResponse(response, 'POST', '/vehicles/upload');
    } catch (error) {
        console.error('Error uploading vehicles:', error);
        throw error;
    }
};

/**
 * Refresh vehicles data from the backend
 * @returns Promise with the refresh response
 */
export const refreshVehicles = async (): Promise<any> => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Authentication token not found');
        }
        
        const response = await axios.post(`${API_BASE_URL}/vehicles/refresh`, {}, {
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Vehicles refreshed successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error refreshing vehicles:', error);
        throw error;
    }
};
