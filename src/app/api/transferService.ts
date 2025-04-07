import axios from 'axios';
import { Transfer, CreateTransferPayload, TransferResponse } from '@/types/transfer';
import { getAccessToken } from '@/app/utils/tokenService';

const BASE_URL = 'https://stock.hisense.com.gh/api/v1.0/transfers';

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
