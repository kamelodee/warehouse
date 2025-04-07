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
 * Fetch all inventory items with optional filtering
 * @param filters Optional filters to apply
 * @returns Promise with array of inventory items
 */
export const getInventoryItems = async (filters?: InventoryFilters): Promise<InventorySearchResponse> => {
  // Build query parameters
  const params = new URLSearchParams();
  params.append('page', String(filters?.page || 0)); // API uses 0-based indexing
  params.append('size', String(filters?.size || 10));
  
  // Add sorting parameters if provided
  if (filters?.sortField) {
    const direction = filters?.sort || 'ASC';
    params.append('sort', `${filters.sortField},${direction}`);
  }
  
  const queryString = `?${params.toString()}`;
  const endpoint = `/inventories/search${queryString}`;
  
  // Build request body with improved search
  const requestBody: any = {
    where: {},
    generalSearch: {
      value: filters?.search ? filters.search.trim() : '',
      fields: ['serialNumber', 'product.name', 'warehouse.name', 'status', 'batchNumber', 'containerNumber', 'blNumber']
    }
  };
  
  // Add warehouse filter if provided
  if (filters?.warehouseId) {
    requestBody.where.warehouseId = filters.warehouseId;
  } else if (filters?.warehouse) {
    // Support both ID and name-based filtering
    requestBody.where.warehouseId = filters.warehouse;
  }
  
  // Add status filter if provided
  if (filters?.status) {
    requestBody.where.status = filters.status;
  }
  
  // Add date range filter if provided
  if (filters?.startDate && filters?.endDate) {
    requestBody.where.createdAt = {
      $gte: filters.startDate,
      $lte: filters.endDate
    };
  }
  
  // Retry mechanism
  const maxRetries = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching inventory items (attempt ${retryCount + 1}/${maxRetries})...`);
      console.log('Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        // Add cache control to prevent browser caching
        cache: 'no-store'
      });
      
      // Handle empty response case
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      const data = await handleResponse<InventorySearchResponse>(response, 'POST', endpoint);
      
      // If the response doesn't have the expected structure, normalize it
      if (!data.content && Array.isArray(data)) {
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
      }
      
      return data;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // Log the error but only throw after all retries fail
      console.warn(`API request failed (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying API request (attempt ${retryCount + 1}/${maxRetries})...`);
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
      method: 'POST',
      headers: getHeaders()
    });
    
    return handleResponse<InventoryItem>(response, 'POST', endpoint);
  } catch (error) {
    logApiError('POST', endpoint, error);
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
      method: 'POST',
      headers: getHeaders()
    });
    
    return handleResponse<any[]>(response, 'POST', endpoint);
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