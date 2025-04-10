import axios from 'axios';
import { Transfer, TransferFilter, TransferResponse } from '@/types/transfer';
import { getAccessToken } from './authService';

const API_URL = 'https://stock.hisense.com.gh/api/v1.0/transfers';

export const fetchTransfers = async (
  page: number = 0, 
  filters: TransferFilter = { 
    where: {}, 
    generalSearch: { value: '', fields: [] } 
  }, 
  size: number = 10
): Promise<TransferResponse> => {
  try {
    const token = getAccessToken();
    
    if (!token) {
      throw new Error('No access token available. Please log in again.');
    }

    const response = await axios.post<TransferResponse>(
      `${API_URL}/search?page=${page}&size=${size}&sort=ASC&sortField=id`, 
      filters,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching transfers:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Transfer fetch failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check your network connection.');
      }
    }
    
    throw new Error('Failed to fetch transfers. Please try again later.');
  }
};
