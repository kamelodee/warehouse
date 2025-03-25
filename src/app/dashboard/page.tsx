"use client";
import React, { useState, useEffect } from 'react';
import {
  FaBox,
  FaUser,
  FaTruck,
  FaWarehouse,
  FaClipboardList,
  FaShoppingCart,
  FaIndustry,
  FaBoxOpen,
  FaClipboardCheck,
  FaChartLine,
  FaTags,
  FaBoxOpen as FaBoxOpenIcon,
  FaExclamationTriangle,
  FaShip,
  FaUserTie
} from 'react-icons/fa';

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

export default function Dashboard() {
  // State management with error handling
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
      pendingShipments: 0
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

  // Centralized error state
  const [errors, setErrors] = useState<DashboardError[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized error logging function
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

  // Safe fetch wrapper with comprehensive error handling
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

      // Return a safe default object to prevent total failure
      return {
        totalElements: 0,
        content: [],
        error: true
      };
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setErrors([]);

      try {
        const token = sessionStorage.getItem('accessToken');

        if (!token) {
          throw new Error('No access token found. Please log in.');
        }

        const fetchOptions = (token: string) => ({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            size: 1000,
            number: 0,
            includeMetrics: true
          })
        });

        // Parallel API calls with safe fetch
        const [
          productData,
          userData,
          shippingData,
          warehouseData
        ] = await Promise.all([
          safeFetch('https://stock.hisense.com.gh/api/v1.0/products/search', fetchOptions(token)),
          safeFetch('https://stock.hisense.com.gh/api/v1.0/users/search', fetchOptions(token)),
          safeFetch('https://stock.hisense.com.gh/api/v1.0/shipments/search', fetchOptions(token)),
          safeFetch('https://stock.hisense.com.gh/api/v1.0/warehouses/search', fetchOptions(token))
        ]);

        // Log the full shipment data for debugging
        console.log('Shipping Data Payload:', JSON.stringify(shippingData, null, 2));

        // Prepare shipments list
        const recentShipments = shippingData.content ?
          shippingData.content.slice(0, 5).map((shipment: Shipment) => ({
            id: shipment.id || Math.random().toString(36).substr(2, 9),
            referenceNumber: shipment.referenceNumber || `REF-${Math.random().toString(36).substr(2, 6)}`,
            status: shipment.status || 'unknown',
            destination: shipment.destination || 'Unknown',
            date: shipment.date || new Date().toISOString()
          })) : 
          [
            { 
              id: '1', 
              referenceNumber: 'REF-001', 
              status: 'in_transit', 
              destination: 'Accra', 
              date: new Date().toISOString() 
            },
            { 
              id: '2', 
              referenceNumber: 'REF-002', 
              status: 'delivered', 
              destination: 'Kumasi', 
              date: new Date().toISOString() 
            }
          ];

        // Update dashboard data with safe defaults
        setDashboardData({
          productMetrics: {
            totalProducts: productData.totalElements || 0,
            activeProducts: productData.activeProducts || 0,
            lowStockProducts: productData.lowStockProducts || 0,
            outOfStockProducts: productData.outOfStockProducts || 0
          },
          userMetrics: {
            totalUsers: userData.totalElements || 0,
            users: userData.content || []
          },
          shippingMetrics: {
            totalShipments: shippingData.totalElements || 0,
            inTransitShipments: shippingData.inTransitShipments || 0,
            deliveredShipments: shippingData.deliveredShipments || 0,
            pendingShipments: shippingData.pendingShipments || 0
          },
          warehouseMetrics: {
            totalWarehouses: warehouseData.totalElements || 0,
            activeWarehouses: warehouseData.activeWarehouses || 0,
            storageCapacity: warehouseData.totalStorageCapacity || 0,
            occupiedSpace: warehouseData.occupiedStorageSpace || 0
          },
          inventoryMetrics: {
            totalInventoryValue: productData.totalInventoryValue || 0,
            lowStockItems: productData.lowStockProducts || 0
          },
          orderMetrics: {
            totalOrders: 0 // Placeholder as endpoint is not available
          },
          supplierMetrics: {
            totalSuppliers: 0 // Placeholder as endpoint is not available
          },
          productCategories: productData.categories || [],
          recentProducts: productData.recentProducts || [],
          recentShipments: recentShipments
        });

      } catch (err) {
        logError({
          type: 'unknown',
          message: err instanceof Error ? err.message : 'An unexpected error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Inventory Manager App</h1>
        </div>
      </header>
      <LoadingIndicator />
      {errors.length > 0 && <ErrorDisplay />}
      
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaTruck className="text-green-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Shipments</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.totalShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Shipments</h4>
                <ul className="space-y-1">
                  {dashboardData.recentShipments.slice(0, 5).map((shipment) => (
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
                <FaShip className="text-blue-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">In Transit</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.inTransitShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">In Transit Shipments</h4>
                <ul className="space-y-1">
                  {dashboardData.recentShipments
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
                  {dashboardData.recentShipments
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
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-1"></div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <FaTruck className="text-green-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Shipments</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.totalShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Shipments</h4>
                <ul className="space-y-1">
                  {dashboardData.recentShipments
                    .slice(0, 5)
                    .map((shipment) => (
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
                <FaShip className="text-blue-600 text-4xl opacity-75" />
                <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">In Transit</span>
              </div>
              <div className="text-4xl font-extrabold text-gray-800 mb-4">
                {dashboardData.shippingMetrics.inTransitShipments}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">In Transit Shipments</h4>
                <ul className="space-y-1">
                  {dashboardData.recentShipments
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
                  {dashboardData.recentShipments
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
      </div>
    </div>
  );
}
