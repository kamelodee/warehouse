// inventoryService.ts - A centralized service for inventory operations
import { logApiError } from './warehouseService';

const API_BASE_URL = 'https://stock.hisense.com.gh/api/v1.0';

/**
 * Interface for inventory item
 */
export interface InventoryItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    code: string;
    name: string;
    category: string;
    serialized: boolean;
    barcodes: string[];
  };
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
  status?: string;
  serialNumber?: string;
  batchNumber?: string;
  containerNumber?: string;
  blNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface for inventory filters
 */
export interface InventoryFilters {
  status?: string;
  warehouse?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortField?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Interface for CSV upload response
 */
export interface CSVUploadResponse {
  fileId: number;
  headers: string[];
}

/**
 * Interface for CSV mapping
 */
export interface CSVMapping {
  fileId: number;
  serialNumberColumn: string;
  productId: string;
  warehouseId: string;
}

/**
 * Interface for inventory search response
 */
export interface InventorySearchResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  content: InventoryItem[];
}

/**
 * Get the authentication token from local storage
 */
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Create common headers with authentication
 */
const getHeaders = (): HeadersInit => {
  const token = getToken();
  if (!token) {
    console.warn('No authentication token found');
  }
  return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
  };
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
 * Upload a CSV file with inventory items
 * @param formData FormData containing the CSV file with 'file' as the key
 * @returns Promise with API response containing fileId and headers
 */
export const uploadInventoryCSV = async (formData: FormData): Promise<CSVUploadResponse> => {
  const endpoint = '/inventories/upload';
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type is automatically set with FormData
        },
        body: formData,
        cache: 'no-store'
      });
      
      return handleResponse<CSVUploadResponse>(response, 'POST', endpoint);
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Log the error but only throw after all retries fail
      console.warn(`CSV upload failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying CSV upload (attempt ${retryCount + 1}/${maxRetries})...`);
      }
    }
  }
  
  // If we've exhausted all retries, log the error and throw
  logApiError('POST', endpoint, lastError);
  throw lastError;
};

/**
 * Map CSV columns to inventory fields and process the upload
 * @param mapping The mapping of CSV columns to inventory fields
 * @returns Promise with processing result
 */
export const processCSVMapping = async (mapping: CSVMapping): Promise<any> => {
  const endpoint = '/inventories/process';
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mapping),
        cache: 'no-store'
      });
      
      return handleResponse<any>(response, 'POST', endpoint);
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Log the error but only throw after all retries fail
      console.warn(`CSV processing failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying CSV processing (attempt ${retryCount + 1}/${maxRetries})...`);
      }
    }
  }
  
  // If we've exhausted all retries, log the error and throw
  logApiError('POST', endpoint, lastError);
  throw lastError;
};

/**
 * Process CSV mapping with all header fields
 * @param productId Product ID for the inventory items
 * @param data Mapping data with all header fields
 * @returns Promise with processing result
 */
export const processInventoryCSV = async (productId: string, data: {
  fileId: string | number;
  serialNumberHeaderName: string;
  batchNumberHeaderName: string;
  containerNumberHeaderName: string;
  blHeaderName: string;
  productId?: string; 
}): Promise<any> => {
  const endpoint = `/inventories/product/${productId}/save`;
  
  // Create a clean request object matching the expected API format
  const requestData = {
    fileId: Number(data.fileId), // Ensure fileId is a number
    serialNumberHeaderName: data.serialNumberHeaderName || '',
    batchNumberHeaderName: data.batchNumberHeaderName || '',
    containerNumberHeaderName: data.containerNumberHeaderName || '',
    blHeaderName: data.blHeaderName || ''
  };
  
  // Log the request for debugging
  console.log(`Processing CSV for product ${productId} with data:`, requestData);
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        cache: 'no-store'
      });
      
      return handleResponse<any>(response, 'POST', endpoint);
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Log the error but only throw after all retries fail
      console.warn(`Inventory CSV processing failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying inventory CSV processing (attempt ${retryCount + 1}/${maxRetries})...`);
      }
    }
  }
  
  // If we've exhausted all retries, log the error and throw
  logApiError('POST', endpoint, lastError);
  throw lastError;
};

/**
 * Get inventory items with optional filtering
 * @param filters Optional filters for inventory items
 * @returns Promise with inventory items
 */
export const getInventoryItems = async (filters?: InventoryFilters): Promise<InventorySearchResponse> => {
  // Build query parameters for pagination
  const queryParams = new URLSearchParams();
  
  // Add pagination parameters
  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  } else {
    queryParams.append('page', '0');
  }
  
  if (filters?.size !== undefined) {
    queryParams.append('size', filters.size.toString());
  } else {
    queryParams.append('size', '10');
  }
  
  // Construct the endpoint with query parameters
  const endpoint = `/inventories/search?${queryParams.toString()}`;
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching inventory items (attempt ${retryCount + 1}/${maxRetries})...`);
      console.log('Request URL:', `${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({}), // Empty body as per the example
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status);
      
      // Handle empty response case
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      
      if (!responseText) {
        console.warn('Empty response received from server');
        return {
          content: [],
          totalPages: 0,
          totalElements: 0,
          size: filters?.size || 10,
          number: filters?.page || 0,
          numberOfElements: 0,
          first: true,
          last: true
        };
      }
      
      // Try to parse the response as JSON
      let data: InventorySearchResponse;
      try {
        data = JSON.parse(responseText);
        console.log('Response data structure:', 
          Object.keys(data).join(', '), 
          'Content items:', data.content?.length || 0
        );
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate the response structure
      if (!data.content) {
        console.warn('Response missing content array, normalizing structure');
        if (Array.isArray(data)) {
          // Handle case where API returns an array directly
          return {
            content: data,
            totalPages: 1,
            totalElements: data.length,
            size: filters?.size || 10,
            number: filters?.page || 0,
            numberOfElements: data.length,
            first: true,
            last: true
          };
        } else {
          // Handle case where API returns an object without content
          return {
            content: [],
            totalPages: 0,
            totalElements: 0,
            size: filters?.size || 10,
            number: filters?.page || 0,
            numberOfElements: 0,
            first: true,
            last: true
          };
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching inventory items (attempt ${retryCount + 1}/${maxRetries}):`, error);
      lastError = error;
      retryCount++;
      
      // Wait before retrying (exponential backoff)
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If we've exhausted all retries, log the error and throw
  logApiError('POST', endpoint, lastError);
  throw lastError;
};

/**
 * Get inventory item by ID
 * @param id Inventory item ID
 * @returns Promise with inventory item details
 */
export const getInventoryItem = async (id: string): Promise<InventoryItem> => {
  const endpoint = `/inventories/${id}`;
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleResponse<InventoryItem>(response, 'GET', endpoint); 
  } catch (error) {
    logApiError('GET', endpoint, error); 
    throw error;
  }
};

/**
 * Update inventory item
 * @param id Inventory item ID
 * @param data Updated inventory data
 * @returns Promise with updated inventory item
 */
export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem> => {
  const endpoint = `/inventories/${id}`;
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    
    return handleResponse<InventoryItem>(response, 'PUT', endpoint);
  } catch (error) {
    logApiError('PUT', endpoint, error);
    throw error;
  }
};

/**
 * Get available warehouses for inventory filtering
 * @returns Promise with array of warehouses
 */
export const getWarehouses = async (): Promise<any[]> => {
  const endpoint = '/warehouses';
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET', 
      headers: getHeaders()
    });
    
    return handleResponse<any[]>(response, 'GET', endpoint); 
  } catch (error) {
    logApiError('GET', endpoint, error); 
    throw error;
  }
};

/**
 * Get available products for inventory
 * @returns Promise with array of products
 */

export const getProducts = async (params: ProductSearchParams = {}): Promise<ProductSearchResponse> => {
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
 * View detailed information about a specific inventory item
 * @param id The ID of the inventory item to view
 * @returns Promise with detailed inventory item information
 */
export const viewInventoryItem = async (id: number): Promise<InventoryItem> => {
  const endpoint = `/inventories/${id}`;
  
  try {
    console.log(`Fetching inventory item details for ID: ${id}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    if (!responseText) {
      console.warn('Empty response received from server');
      throw new Error('Empty response received when fetching inventory item details');
    }
    
    // Parse the response
    try {
      const data = JSON.parse(responseText);
      console.log('Inventory item details retrieved successfully');
      return data;
    } catch (parseError) {
      console.error('Error parsing inventory item details:', parseError);
      throw new Error('Invalid JSON response when fetching inventory item details');
    }
  } catch (error) {
    console.error(`Error fetching inventory item details:`, error);
    logApiError('GET', endpoint, error);
    throw error;
  }
};