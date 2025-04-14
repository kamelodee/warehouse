"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBox,
  FaUser,
  FaClipboardList,
  FaShoppingCart,
  FaIndustry,
  FaClipboardCheck,
  FaChartLine,
  FaTags,
  FaBoxOpen as FaBoxOpenIcon,
  FaExclamationTriangle,
  FaShip,
  FaUserTie,
  FaExchangeAlt,
  FaRoad,
  FaFilter,
  FaTimes,
  FaShuttleVan,
  FaClock
} from 'react-icons/fa';
import { withAuth } from '../components/withAuth';
import { useLogout } from '@/app/utils/logout';
import { getWarehouses } from '@/app/api/warehouseService';
import { Warehouse as WarehouseService } from '@/app/api/warehouseService';
import { Warehouse } from '@/types/warehouse';

// Expanded interfaces to include shipping and user metrics
interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface UserMetrics {
  totalUsers: number;
  users: Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
  }>;
}

interface ShippingMetrics {
  totalShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  receivedShipments: number;
  transferredShipments: number;
  leftShipments: number;
  onHoldShipments: number;
  cancelledShipments: number;
  totalCompleteShipments: number;
  totalIncompleteShipments: number;
  completedShipments: number;
}

interface WarehouseMetrics {
  totalWarehouses: number;
  activeWarehouses: number;
  storageCapacity: number;
  occupiedSpace: number;
}

interface InventoryMetrics {
  totalInventoryValue: number;
  lowStockItems: number;
}

interface OrderMetrics {
  totalOrders: number;
}

interface SupplierMetrics {
  totalSuppliers: number;
}

interface ProductCategory {
  name: string;
  productCount: number;
  percentageOfTotal: number;
}

interface RecentProduct {
  id: number;
  name: string;
  category: string;
  status: 'low_stock' | 'in_stock' | 'out_of_stock';
  quantity: number;
}

interface Shipment {
  id?: number | string;
  referenceNumber?: string;
  status?: string;
  destination?: string;
  date?: string;
}

interface RecentShipment {
  id: number;
  referenceNumber: string;
  status: 'in_transit' | 'delivered' | 'pending';
  destination: string;
  date: string;
}

interface DashboardData {
  productMetrics: ProductMetrics;
  userMetrics: UserMetrics;
  shippingMetrics: ShippingMetrics;
  warehouseMetrics: WarehouseMetrics;
  inventoryMetrics: InventoryMetrics;
  orderMetrics: OrderMetrics;
  supplierMetrics: SupplierMetrics;
  productCategories: ProductCategory[];
  recentProducts: RecentProduct[];
  recentShipments: RecentShipment[];
}

// Error handling interface
interface DashboardError {
  type: 'network' | 'authentication' | 'parsing' | 'unknown';
  message: string;
  timestamp: number;
  endpoint?: string;
}

interface UserData {
  role: 'SUPER_ADMIN' | 'WAREHOUSE_USER' | 'USER';
  warehouse?: {
    id: number;
    name: string;
  };
}

const prepareFetchOptions = (token: string, selectedWarehouse: Warehouse | null) => {
  // Get user data from localStorage
  const user = localStorage.getItem('user');
  const userData: UserData | null = user ? JSON.parse(user) : null;
  const userRole = userData?.role;
  const userWarehouseId = userData?.warehouse?.id;
  console.log('User role:', userRole);
  console.log('User warehouse ID:', userWarehouseId);
  console.log('Selected warehouse ID:', selectedWarehouse?.id);

  // Build query parameters
  const queryParams = new URLSearchParams({
    size: '10',
    page: '0',
    includeMetrics: 'true'
  }).toString();

  // Get the selected warehouse for admin users
  const selectedWarehouseId = userRole === 'SUPER_ADMIN' ? selectedWarehouse?.id : userWarehouseId;

  // Base request options
  const baseOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    queryParams
  };

  // Only add warehouse filters if a warehouse is selected or for warehouse users
  if ((userRole === 'WAREHOUSE_USER' || (userRole === 'SUPER_ADMIN' && selectedWarehouse !== null))) {
    return {
      ...baseOptions,
      body: JSON.stringify({
        where: [
          {
            leftHand: { value: "sourceWarehouseId" },
            matchMode: "EQUAL",
            rightHand: { value: selectedWarehouseId },
            operator: "OR"
          },
          {
            leftHand: { value: "destinationWarehouseId" },
            matchMode: "EQUAL",
            rightHand: { value: selectedWarehouseId },
            operator: "OR"
          }
        ]
      })
    };
  }

  // Return default options without warehouse filters
  return {
    ...baseOptions,
    body: JSON.stringify({
      where: []
    })
  };
};

const normalizeShipment = (shipment: Partial<Shipment>): RecentShipment => ({
  id: shipment.id ? Number(shipment.id) : Math.floor(Math.random() * 1000),
  referenceNumber: shipment.referenceNumber || `REF-${Math.random().toString(36).substr(2, 6)}`,
  status: (shipment.status as RecentShipment['status']) || 'pending',
  destination: shipment.destination || 'Unknown',
  date: shipment.date || new Date().toISOString()
});

const generateDefaultShipments = (): RecentShipment[] => [
  { 
    id: 1, 
    referenceNumber: 'REF-001', 
    status: 'in_transit', 
    destination: 'Accra', 
    date: new Date().toISOString() 
  },
  { 
    id: 2, 
    referenceNumber: 'REF-002', 
    status: 'delivered', 
    destination: 'Kumasi', 
    date: new Date().toISOString() 
  }
];

const extractShippingMetrics = (data: any): ShippingMetrics => {
  // If no data or content, return default metrics
  if (!data || !data.content) {
    return {
      totalShipments: 0,
      inTransitShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      receivedShipments: 0,
      transferredShipments: 0,
      leftShipments: 0,
      onHoldShipments: 0,
      cancelledShipments: 0,
      totalCompleteShipments: 0,
      totalIncompleteShipments: 0,
      completedShipments: 0
    };
  }

  // Filter shipments based on status
  const shipments = data.content;
  return {
    totalShipments: shipments.length,
    inTransitShipments: shipments.filter((s: any) => s.status === 'IN_TRANSIT').length,
    deliveredShipments: shipments.filter((s: any) => s.status === 'DELIVERED').length,
    pendingShipments: shipments.filter((s: any) => s.status === 'PENDING').length,
    receivedShipments: shipments.filter((s: any) => s.status === 'RECEIVED').length,
    transferredShipments: shipments.filter((s: any) => s.status === 'TRANSFERRED').length,
    leftShipments: shipments.filter((s: any) => s.status === 'LEFT').length,
    onHoldShipments: shipments.filter((s: any) => s.status === 'ON_HOLD').length,
    cancelledShipments: shipments.filter((s: any) => s.status === 'CANCELLED').length,
    totalCompleteShipments: shipments.filter((s: any) => s.status === 'DELIVERED' || s.status === 'COMPLETED').length,
    totalIncompleteShipments: shipments.filter((s: any) => s.status !== 'DELIVERED' && s.status !== 'COMPLETED').length,
    completedShipments: shipments.filter((s: any) => s.status === 'COMPLETED').length
  };
};

// Mapping function to convert service warehouse to project warehouse
const mapWarehouse = (serviceWarehouse: WarehouseService): Warehouse => ({
  id: serviceWarehouse.id || 0,
  name: serviceWarehouse.name,
  location: serviceWarehouse.location || '',
  code: serviceWarehouse.code || '',
});

function DashboardPage() {
  const logout = useLogout();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    productMetrics: {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0
    },
    userMetrics: {
      totalUsers: 0,
      users: []
    },
    shippingMetrics: {
      totalShipments: 0,
      inTransitShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      receivedShipments: 0,
      transferredShipments: 0,
      leftShipments: 0,
      onHoldShipments: 0,
      cancelledShipments: 0,
      totalCompleteShipments: 0,
      totalIncompleteShipments: 0,
      completedShipments: 0
    },
    warehouseMetrics: {
      totalWarehouses: 0,
      activeWarehouses: 0,
      storageCapacity: 0,
      occupiedSpace: 0
    },
    inventoryMetrics: {
      totalInventoryValue: 0,
      lowStockItems: 0
    },
    orderMetrics: {
      totalOrders: 0
    },
    supplierMetrics: {
      totalSuppliers: 0
    },
    productCategories: [],
    recentProducts: [],
    recentShipments: []
  });

  const [errors, setErrors] = useState<DashboardError[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const logError = (error: Partial<DashboardError>) => {
    const newError: DashboardError = {
      type: error.type || 'unknown',
      message: error.message || 'An unexpected error occurred',
      timestamp: Date.now(),
      endpoint: error.endpoint
    };

    setErrors(prevErrors => [...prevErrors, newError]);
    console.error('Dashboard Error:', newError);
  };

  const safeFetch = async (url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, url: ${url}`);
      }

      return await response.json();
    } catch (error) {
      logError({
        type: error instanceof TypeError ? 'network' : 'unknown',
        message: error instanceof Error ? error.message : 'Fetch failed',
        endpoint: url
      });

      return {
        totalElements: 0,
        content: [],
        error: true
      };
    }
  };

  const fetchWarehouses = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await safeFetch('https://stock.hisense.com.gh/api/v1.0/warehouses/search?page=0&size=100&sort=ASC&sortField=id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          size: 100,
          page: 0
        })
      });

      if (response?.content && Array.isArray(response.content)) {
        const mappedWarehouses = response.content.map(mapWarehouse);
        setWarehouses(mappedWarehouses);
        
        // For warehouse users, set their warehouse as selected
        const user = localStorage.getItem('user');
        const userData: UserData | null = user ? JSON.parse(user) : null;
        if (userData?.role === 'WAREHOUSE_USER' && userData?.warehouse) {
          const userWarehouse = mappedWarehouses.find((w: Warehouse) => w.id === userData.warehouse.id);
          if (userWarehouse) {
            setSelectedWarehouse(userWarehouse);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      logError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to fetch warehouses'
      });
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);

    try {
      const token = localStorage.getItem('accessToken');
      console.log("Token from localStorage:", token);
      
      if (!token || token.trim() === '') {
        console.error('No valid token found');
        router.push('/login');
        return;
      }

      const fetchOptions = prepareFetchOptions(token, selectedWarehouse);
      console.log('Fetch options:', fetchOptions);

      const [shippingData] = await Promise.all([
        safeFetch(`https://stock.hisense.com.gh/api/v1.0/shipments/search?${fetchOptions.queryParams}`, fetchOptions)
      ]);

      console.log('Shipping Data Payload:', JSON.stringify(shippingData, null, 2));

      // Update metrics based on filtered data
      const metrics = extractShippingMetrics(shippingData);
      console.log('Updated Metrics:', metrics);

      const recentShipments = shippingData.content
        ? shippingData.content.slice(0, 5).map(normalizeShipment)
        : generateDefaultShipments();

      setDashboardData(prev => ({
        ...prev,
        shippingMetrics: metrics,
        recentShipments: recentShipments
      }));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      logError({
        type: 'unknown',
        message: err instanceof Error ? err.message : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedWarehouse]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle warehouse selection change
  const handleWarehouseChange = useCallback((warehouse: Warehouse | null) => {
    setSelectedWarehouse(warehouse);
    // Fetch shipments with the new warehouse selection
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Error display component
  const ErrorDisplay = () => {
    if (errors.length === 0) return null;

    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Dashboard Errors Detected!</strong>
        <ul className="mt-2">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {error.message} {error.endpoint && `(Endpoint: ${error.endpoint})`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Loading indicator
  const LoadingIndicator = () => {
    if (!isLoading) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  };

  // Shipment Filters Interface
  interface ShipmentFilters {
    status?: 'all' | 'in_transit' | 'delivered' | 'pending';
    startDate?: string;
    endDate?: string;
    sourceWarehouse?: string;
  }

  // State for shipment filters
  const [shipmentFilters, setShipmentFilters] = useState<ShipmentFilters>({
    status: 'all'
  });

  const ShipmentFilters = () => {
    // Get user data for role-based rendering
    const user = localStorage.getItem('user');
    const userData: UserData | null = user ? JSON.parse(user) : null;

    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Shipments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Status</label>
            <select
              value={shipmentFilters.status || ''}
              onChange={(e) => setShipmentFilters(prev => ({ 
                ...prev, 
                status: e.target.value as ShipmentFilters['status'] || undefined 
              }))}
              className="w-full border border-indigo-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Warehouse Filter - Only visible for SUPER_ADMIN */}
          {userData?.role === 'SUPER_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Warehouse</label>
              <select
                value={selectedWarehouse?.id || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    // Clear selection to show all warehouses
                    handleWarehouseChange(null);
                  } else {
                    const selected = warehouses.find(w => w.id === Number(value));
                    if (selected) handleWarehouseChange(selected);

                    setShipmentFilters(prev => ({ 
                      ...prev, 
                      sourceWarehouse: selectedWarehouse?.name || undefined 
                    }))
                  }
                }}
                className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date filters */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
            <input
              type="date"
              value={shipmentFilters.startDate || ''}
              onChange={(e) => setShipmentFilters(prev => ({ 
                ...prev, 
                startDate: e.target.value || undefined 
              }))}
              className="w-full border border-indigo-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
            <input
              type="date"
              value={shipmentFilters.endDate || ''}
              onChange={(e) => setShipmentFilters(prev => ({ 
                ...prev, 
                endDate: e.target.value || undefined 
              }))}
              className="w-full border border-indigo-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(shipmentFilters).map(([key, value]) => {
            if (!value) return null;
            return (
              <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {key}: {value}
                <button
                  onClick={() => setShipmentFilters(prev => ({ ...prev, [key]: undefined }))}
                  className="ml-2 inline-flex text-indigo-400 hover:text-indigo-600"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // Filtered shipments logic
  const filteredShipments = dashboardData.recentShipments.filter(shipment => {
    // Status filtering
    if (shipmentFilters.status !== 'all' && shipment.status !== shipmentFilters.status) 
      return false;

    // Date filtering
    if (shipmentFilters.startDate && new Date(shipment.date) < new Date(shipmentFilters.startDate)) 
      return false;
    if (shipmentFilters.endDate && new Date(shipment.date) > new Date(shipmentFilters.endDate)) 
      return false;

    // Warehouse filtering
    if (shipmentFilters.sourceWarehouse && shipment.destination !== shipmentFilters.sourceWarehouse) 
      return false;

    return true;
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        
       
      </header>
      <LoadingIndicator />
      {errors.length > 0 && <ErrorDisplay />}
      
      <div className="container mx-auto">
        
        <ShipmentFilters />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaClipboardList className="text-green-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Shipments</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.totalShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Shipments</h4>
                <ul className="space-y-1">
                  {filteredShipments.slice(0, 5).map((shipment) => (
                    <li key={shipment.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{shipment.referenceNumber}</span>
                      <span className={`
                        ${shipment.status === 'delivered' ? 'text-green-600' : 
                          shipment.status === 'in_transit' ? 'text-blue-600' : 
                          'text-yellow-600'}
                      `}>
                        {shipment.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaShuttleVan className="text-blue-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">In Transit</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.inTransitShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">In Transit Shipments</h4>
                <ul className="space-y-1">
                  {filteredShipments
                    .filter(shipment => shipment.status === 'in_transit')
                    .slice(0, 5)
                    .map((shipment) => (
                    <li key={shipment.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{shipment.referenceNumber}</span>
                      <span>{shipment.destination}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaClipboardCheck className="text-emerald-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Delivered</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.deliveredShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivered Shipments</h4>
                <ul className="space-y-1">
                  {filteredShipments
                    .filter(shipment => shipment.status === 'delivered')
                    .slice(0, 5)
                    .map((shipment) => (
                    <li key={shipment.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{shipment.referenceNumber}</span>
                      <span>{shipment.destination}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaIndustry className="text-yellow-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Incomplete</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.totalIncompleteShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Incomplete Shipments</h4>
                <ul className="space-y-1">
                  {filteredShipments
                    .filter(shipment => 
                      shipment.status === 'in_transit' || 
                      shipment.status === 'pending'
                    )
                    .slice(0, 5)
                    .map((shipment) => (
                    <li key={shipment.id} className="text-sm text-gray-600 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {shipment.status === 'in_transit' ? (
                          <FaShuttleVan className="text-blue-600" />
                        ) : shipment.status === 'pending' ? (
                          <FaClock className="text-yellow-600" />
                        ) : (
                          <FaExclamationTriangle className="text-gray-600" />
                        )}
                        <span>{shipment.referenceNumber}</span>
                      </div>
                      <span className={`
                        ${shipment.status === 'in_transit' ? 'text-blue-600' : 
                          shipment.status === 'pending' ? 'text-yellow-600' : 
                          'text-gray-600'}
                      `}>
                        {shipment.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaShoppingCart className="text-blue-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Completed</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.totalCompleteShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Completed Shipments</h4>
                <ul className="space-y-1">
                  {filteredShipments
                    .filter(shipment => shipment.status === 'delivered')
                    .slice(0, 5)
                    .map((shipment) => (
                    <li key={shipment.id} className="text-sm text-gray-600 flex justify-between">
                      <span>{shipment.referenceNumber}</span>
                      <span>{shipment.destination}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaChartLine className="text-emerald-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Shipment Overview</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <FaBox className="text-emerald-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Total Received</h4>
                    <p className="text-lg font-bold text-gray-900">{dashboardData.shippingMetrics.receivedShipments}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FaExchangeAlt className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Total Transferred</h4>
                    <p className="text-lg font-bold text-gray-900">{dashboardData.shippingMetrics.transferredShipments}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <FaRoad className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Total Left</h4>
                    <p className="text-lg font-bold text-gray-900">{dashboardData.shippingMetrics.leftShipments}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);