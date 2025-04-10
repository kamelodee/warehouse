import axios from 'axios';
import { Warehouse } from '@/types/warehouse';
import { getAccessToken } from './authService';

const API_URL = 'https://stock.hisense.com.gh/api/v1.0/warehouses';

// Simplified warehouse type for rendering
interface SimpleWarehouse {
  id: string;
  name: string;
}

// Utility function to sanitize a single warehouse
const sanitizeWarehouse = (warehouse: any): SimpleWarehouse | null => {
  // Extremely defensive checks
  if (
    warehouse &&
    typeof warehouse === 'object' &&
    (typeof warehouse.id === 'number' || typeof warehouse.id === 'string') &&
    typeof warehouse.name === 'string' &&
    warehouse.name.trim() !== ''
  ) {
    return {
      id: String(warehouse.id),
      name: warehouse.name.trim()
    };
  }
  return null;
};

export const fetchWarehouses = async (): Promise<SimpleWarehouse[]> => {
  try {
    const token = getAccessToken();
    
    if (!token) {
      throw new Error('No access token available. Please log in again.');
    }

    const response = await axios.post<any>(`${API_URL}/search`, 
      // Empty filter object for all warehouses
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle different possible response structures
    let warehouseList: any[] = [];
    
    if (Array.isArray(response.data)) {
      // Direct array response
      warehouseList = response.data;
    } else if (response.data && Array.isArray(response.data.content)) {
      // Response with content property
      warehouseList = response.data.content;
    } else if (response.data && typeof response.data === 'object') {
      // Fallback to try and extract warehouse data
      warehouseList = Object.values(response.data).filter(
        item => typeof item === 'object' && item !== null
      );
    }

    // Sanitize warehouses with extremely strict filtering
    const sanitizedWarehouses: SimpleWarehouse[] = warehouseList
      .map(warehouse => {
        // Explicitly extract only primitive values
        if (typeof warehouse === 'object' && warehouse !== null) {
          return {
            id: String(warehouse.id || ''),
            name: String(warehouse.name || 'Unknown')
          };
        }
        return null;
      })
      .filter((w): w is SimpleWarehouse => 
        w !== null && 
        w.id !== '' && 
        w.name !== 'Unknown'
      );

    // Additional logging for debugging
    if (sanitizedWarehouses.length === 0) {
      console.warn('No valid warehouses found', { 
        originalData: warehouseList,
        sanitizationDetails: warehouseList.map(w => ({
          id: typeof w?.id,
          name: typeof w?.name,
          isObject: typeof w === 'object'
        }))
      });
    }

    return sanitizedWarehouses;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Warehouse fetch failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check your network connection.');
      }
    }
    
    throw new Error('Failed to fetch warehouses. Please try again later.');
  }
};
