import { logApiError } from './warehouseService';

export interface ProductMetrics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}

export interface ShippingMetrics {
  totalShipments: number;
  inTransit: number;
  delivered: number;
}

export interface WarehouseMetrics {
  totalCapacity: number;
  currentOccupancy: number;
  availableSpace: number;
}

export interface InventoryMetrics {
  totalInventoryValue: number;
  categorizedInventory: Record<string, number>;
}

export interface RecentShipment {
  id: number;
  referenceNumber: string;
  status: 'in_transit' | 'delivered' | 'pending';
  destination: string;
  date: string;
}

export interface DashboardData {
  productMetrics: ProductMetrics;
  userMetrics: UserMetrics;
  shippingMetrics: ShippingMetrics;
  warehouseMetrics: WarehouseMetrics;
  inventoryMetrics: InventoryMetrics;
  recentShipments: RecentShipment[];
}

export const dashboardService = {
  /**
   * Fetch comprehensive dashboard data
   * @param accessToken Authentication token
   * @returns Promise with dashboard metrics
   */
  fetchDashboardData: async (accessToken: string): Promise<DashboardData> => {
    try {
      const response = await fetch('https://stock.hisense.com.gh/api/v1.0/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      return await response.json();
    } catch (error) {
      logApiError('GET', '/dashboard', error);
      throw error;
    }
  }
};
