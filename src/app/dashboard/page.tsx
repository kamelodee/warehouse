"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const prepareFetchOptions = (token: string) => ({
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

const extractShippingMetrics = (shippingData: any): ShippingMetrics => ({
  totalShipments: shippingData.totalElements || 0,
  inTransitShipments: shippingData.inTransitShipments || 0,
  deliveredShipments: shippingData.deliveredShipments || 0,
  pendingShipments: shippingData.pendingShipments || 0,
  receivedShipments: shippingData.receivedShipments || 0,
  transferredShipments: shippingData.transferredShipments || 0,
  leftShipments: shippingData.leftShipments || 0,
  onHoldShipments: shippingData.onHoldShipments || 0,
  cancelledShipments: shippingData.cancelledShipments || 0,
  totalCompleteShipments: shippingData.totalCompleteShipments || 0,
  totalIncompleteShipments: shippingData.totalIncompleteShipments || 0,
  completedShipments: shippingData.completedShipments || 0
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

  useEffect(() => {
    const fetchDashboardData = async () => {
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

        const fetchOptions = prepareFetchOptions(token);

        const [shippingData] = await Promise.all([
          safeFetch('https://stock.hisense.com.gh/api/v1.0/shipments/search', fetchOptions)
        ]);

        console.log('Shipping Data Payload:', JSON.stringify(shippingData, null, 2));

        const recentShipments = shippingData.content
          ? shippingData.content.slice(0, 5).map(normalizeShipment)
          : generateDefaultShipments();

        setDashboardData(prev => ({
          ...prev,
          shippingMetrics: extractShippingMetrics(shippingData),
          recentShipments: recentShipments
        }));

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

  // Shipment Filters Interface
  interface ShipmentFilters {
    status?: 'all' | 'in_transit' | 'delivered' | 'pending';
    startDate?: string;
    endDate?: string;
    sourceWarehouse?: string;
    destinationWarehouse?: string;
  }

  // State for shipment filters
  const [shipmentFilters, setShipmentFilters] = useState<ShipmentFilters>({
    status: 'all'
  });

  // Shipment Filters Component
  const ShipmentFilters: React.FC = () => {
    // Render filter badges
    const renderFilterBadges = (): React.ReactNode[] => {
      const badges: React.ReactNode[] = [];

      if (shipmentFilters.status && shipmentFilters.status !== 'all') {
        badges.push(
          <span key="status" className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
            Status: {shipmentFilters.status}
            <button 
              onClick={() => setShipmentFilters(prev => ({ ...prev, status: 'all' }))}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              <FaTimes className="inline-block w-3 h-3" />
            </button>
          </span>
        );
      }

      if (shipmentFilters.startDate) {
        badges.push(
          <span key="startDate" className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
            From: {new Date(shipmentFilters.startDate).toLocaleDateString()}
            <button 
              onClick={() => setShipmentFilters(prev => ({ ...prev, startDate: undefined }))}
              className="ml-1 text-green-600 hover:text-green-800"
            >
              <FaTimes className="inline-block w-3 h-3" />
            </button>
          </span>
        );
      }

      if (shipmentFilters.endDate) {
        badges.push(
          <span key="endDate" className="bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
            To: {new Date(shipmentFilters.endDate).toLocaleDateString()}
            <button 
              onClick={() => setShipmentFilters(prev => ({ ...prev, endDate: undefined }))}
              className="ml-1 text-purple-600 hover:text-purple-800"
            >
              <FaTimes className="inline-block w-3 h-3" />
            </button>
          </span>
        );
      }

      return badges;
    };

    // Clear filters function
    const clearFilters = () => {
      setShipmentFilters({ status: 'all' });
    };

    // Get unique warehouse options from recent shipments
    const sourceWarehouses = [...new Set(dashboardData.recentShipments.map(s => s.destination))];

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <FaFilter className="mr-2 text-blue-600" /> Shipment Filters
          </h3>
          {Object.keys(shipmentFilters).length > 1 && (
            <button 
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <FaTimes className="mr-1" /> Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Status</label>
            <select
              value={shipmentFilters.status || 'all'}
              onChange={(e) => setShipmentFilters(prev => ({ 
                ...prev, 
                status: e.target.value as ShipmentFilters['status'] 
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Shipments</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={shipmentFilters.startDate || ''}
              onChange={(e) => setShipmentFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={shipmentFilters.endDate || ''}
              onChange={(e) => setShipmentFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              value={shipmentFilters.sourceWarehouse || ''}
              onChange={(e) => setShipmentFilters(prev => ({ ...prev, sourceWarehouse: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {sourceWarehouses.map(warehouse => (
                <option key={warehouse} value={warehouse}>{warehouse}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Badges */}
        {Object.keys(shipmentFilters).length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Active Filters:</span>
            {renderFilterBadges()}
          </div>
        )}
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
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Inventory Manager App</h1>
        </div>
        <div className="flex items-center space-x-4">
         
        </div>
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