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
          recentShipments: shippingData.recentShipments || []
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
    <div className="min-h-screen bg-gray-50 p-6">
      <LoadingIndicator />
      {errors.length > 0 && <ErrorDisplay />}
      
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Dashboard</h1>
            <p className="text-gray-600">Detailed insights across all business operations</p>
          </div>
          <div className="flex space-x-4">
            <button className="btn btn-primary flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <FaClipboardList className="mr-2" /> Generate Report
            </button>
            <button className="btn btn-secondary flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              <FaChartLine className="mr-2" /> Analyze Data
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Products Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaBox className="text-blue-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Products</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboardData.productMetrics.totalProducts}
            </div>
            <div className="text-sm text-green-600 mt-2">
              +{dashboardData.productMetrics.activeProducts} Active
            </div>
          </div>

          {/* Users Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaUser className="text-purple-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboardData.userMetrics?.totalUsers || 0}
            </div>
            <div className="text-sm text-green-600 mt-2">
              +{(dashboardData.userMetrics?.users || []).filter(u => u.status === 'active').length} Active
            </div>
          </div>

          {/* Shipping Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaTruck className="text-green-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Shipments</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboardData.shippingMetrics.totalShipments}
            </div>
            <div className="text-sm text-green-600 mt-2">
              +{dashboardData.shippingMetrics.deliveredShipments} Delivered
            </div>
          </div>

          {/* Warehouses Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaWarehouse className="text-indigo-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Warehouses</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboardData.warehouseMetrics.totalWarehouses}
            </div>
            <div className="text-sm text-green-600 mt-2">
              +{dashboardData.warehouseMetrics.activeWarehouses} Active
            </div>
          </div>
        </div>

        {/* Additional Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {/* Inventory Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaClipboardList className="text-yellow-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Inventory Value</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ${dashboardData.inventoryMetrics.totalInventoryValue.toLocaleString()}
            </div>
            <div className="text-sm text-red-600 mt-2">
              {dashboardData.inventoryMetrics.lowStockItems} Low Stock
            </div>
          </div>

          {/* Orders Metrics - Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaShoppingCart className="text-teal-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Orders</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              N/A
            </div>
            <div className="text-sm text-yellow-600 mt-2">
              Endpoint Unavailable
            </div>
          </div>

          {/* Suppliers Metrics - Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaIndustry className="text-pink-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Total Suppliers</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              N/A
            </div>
            <div className="text-sm text-green-600 mt-2">
              Endpoint Unavailable
            </div>
          </div>

          {/* Storage Capacity Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <FaBoxOpen className="text-orange-500 text-3xl" />
              <span className="text-sm text-gray-500 font-medium">Storage Capacity</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dashboardData.warehouseMetrics.storageCapacity} sqft
            </div>
            <div className="text-sm text-blue-600 mt-2">
              {Math.round((dashboardData.warehouseMetrics.occupiedSpace / dashboardData.warehouseMetrics.storageCapacity) * 100)}% Occupied
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
