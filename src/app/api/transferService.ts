import axios from 'axios';
import { Transfer, CreateTransferPayload, TransferResponse } from '@/types/transfer';
import { getAccessToken } from '@/app/utils/tokenService';

const BASE_URL = 'https://stock.hisense.com.gh/api/v1.0/transfers';

export interface ApiErrorResponse {
  status: string;
  timestamp: string;
  message: string;
  debugMessage?: string | null;
  subErrors?: any[] | null;
}

export const createTransfer = async (transferData: CreateTransferPayload): Promise<Transfer> => {
  try {
    const token = getAccessToken();
    const response = await axios.post<Transfer>(BASE_URL, transferData, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw error;
  }
};

export const getTransfers = async (
  page = 0, 
  size = 10, 
  sort = 'ASC', 
  sortField = 'id', 
  where = {}, 
  generalSearch?: { 
    value?: string, 
    fields?: string[] 
  }
): Promise<TransferResponse> => {
  try {
    const token = getAccessToken();
    const response = await axios.post<TransferResponse>(
      `${BASE_URL}/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`, 
      { 
        where, 
        generalSearch: generalSearch || { 
          value: '', 
          fields: [] 
        }
      },
      {
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching transfers:', error);
    throw error;
  }
};

export const getTransferById = async (transferId: number): Promise<Transfer> => {
  try {
    const token = getAccessToken();
    const response = await axios.get<Transfer>(`${BASE_URL}/${transferId}`, {
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token || ''}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching transfer ${transferId}:`, error);
    throw error;
  }
};

export const uploadTransfers = async (file: File): Promise<any> => {
  try {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'accept': '*/*',
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token || ''}`
      }
    });

    return response.data;
  } catch (error: any) {
    // Check if the error has a response from the server
    if (error.response && error.response.data) {
      const apiError = error.response.data as ApiErrorResponse;
      
      // Log the full error for debugging
      console.error('Transfer upload error:', apiError);
      
      // Throw the error with the specific message
      throw new Error(apiError.message || 'Failed to upload transfers');
    }
    
    // If no specific server response, throw a generic error
    console.error('Error uploading transfers:', error);
    throw new Error('Failed to upload transfers. Please try again.');
  }
};
