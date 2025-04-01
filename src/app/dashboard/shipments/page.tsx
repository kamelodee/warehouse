'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { searchShipments, deleteShipment, Shipment } from '../../api/shipmentService';
import { searchWarehouses, Warehouse } from '../../api/warehouseService';
import { searchVehicles, Vehicle } from '../../api/vehicleService';
import ShipmentDetailsModal from './ShipmentDetailsModal';

// Use the Shipment interface from shipmentService but ensure id is required
interface ShipmentWithRequiredId extends Omit<Shipment, 'id'> {
    id: number;
}

const Shipments = () => {
    const [shipments, setShipments] = useState<ShipmentWithRequiredId[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deletingShipmentIds, setDeletingShipmentIds] = useState<number[]>([]);
    const [warehouses, setWarehouses] = useState<{ [key: number]: Warehouse }>({});
    const [vehicles, setVehicles] = useState<{ [key: number]: Vehicle }>({});
    // New state for selected shipment details
    const [selectedShipment, setSelectedShipment] = useState<ShipmentWithRequiredId | null>(null);

    // Loading states used in warehouse data fetching
    const [_isLoadingWarehouses, setIsLoadingWarehouses] = useState<boolean>(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    // Loading states used in vehicle data fetching
    const [_isLoadingVehicles, setIsLoadingVehicles] = useState<boolean>(false); // eslint-disable-line @typescript-eslint/no-unused-vars
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('referenceNumber');
    const [totalPages, setTotalPages] = useState<number>(0);
    // Total elements used for internal calculations
    const [_totalElements, setTotalElements] = useState<number>(0); // eslint-disable-line @typescript-eslint/no-unused-vars

    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        setToken(storedToken);
        if (!storedToken) {
            window.location.href = '/login';
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        if (!token) return;
        setIsLoadingWarehouses(true);
        
        try {
            const data = await searchWarehouses({
                page: 0,
                size: 1000,
                sort: 'ASC',
                sortField: 'name'
            });
            
            if (data.content && data.content.length > 0) {
                const warehouseMap: { [key: number]: Warehouse } = {};
                data.content.forEach(warehouse => {
                    // Explicitly check for defined id
                    if (warehouse.id) {
                        warehouseMap[warehouse.id] = warehouse;
                    }
                });
                
                setWarehouses(warehouseMap);
            } else {
                setWarehouses({});
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        } finally {
            setIsLoadingWarehouses(false);
        }
    }, [token]);
    
    const fetchVehicles = useCallback(async () => {
        try {
            const data = await searchVehicles({
                page: 0,
                size: 1000
            });
            
            if (data.content && data.content.length > 0) {
                const vehicleMap: { [key: number]: Vehicle } = {};
                data.content.forEach(vehicle => {
                    // Explicitly check for defined id
                    if (vehicle.id) {
                        vehicleMap[vehicle.id] = vehicle;
                    }
                });
                
                setVehicles(vehicleMap);
            } else {
                setVehicles({});
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setVehicles({});
        }
    }, []);

    const fetchShipments = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await searchShipments({
                page,
                size,
                sort,
                sortField
            });
            
            // Filter out any shipments without an id
            const shipmentsWithId = data.content
                .filter((shipment): shipment is ShipmentWithRequiredId => 
                    shipment.id !== undefined
                );
            
            setShipments(shipmentsWithId);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Error fetching shipments:', error);
            setError(error as Error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, size, sort, sortField]);

    useEffect(() => {
        if (token) {
            fetchWarehouses();
            fetchVehicles();
            fetchShipments();
        }
    }, [token, fetchWarehouses, fetchVehicles, fetchShipments]);

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this shipment?');
        if (confirmed) {
            // Add shipment ID to the deleting list
            setDeletingShipmentIds(prev => [...prev, id]);
            
            try {
                await deleteShipment(id);
                // Remove shipment from the list without refetching to improve performance
                setShipments(prev => prev.filter(shipment => shipment.id !== id));
                // Show success message
                const shipmentRef = shipments.find(s => s.id === id)?.referenceNumber || `Shipment #${id}`;
                alert(`${shipmentRef} has been deleted successfully.`);
            } catch (error) {
                console.error('Error deleting shipment:', error);
                // Show detailed error message
                const errorMessage = (error as Error).message || 'An unknown error occurred';
                alert(`Failed to delete shipment: ${errorMessage}`);
                
                // Log additional details for debugging
                console.error('Delete shipment error details:', {
                    shipmentId: id,
                    timestamp: new Date().toISOString(),
                    error
                });
            } finally {
                // Remove shipment ID from the deleting list
                setDeletingShipmentIds(prev => prev.filter(sid => sid !== id));
                // Refresh the shipment list to ensure data consistency
                fetchShipments();
            }
        }
    };

    // Format date to a more readable format
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Get appropriate status badge color
    const getStatusBadgeColor = (status: string | null | undefined) => {
        if (!status) return 'bg-gray-100 text-gray-800'; // Handle null or undefined status
        
        switch (status.toLowerCase()) {
            case 'pending':
            case 'pending_approval':
                return 'bg-yellow-100 text-yellow-800';
            case 'in_transit':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get shipment type display
    const getShipmentTypeDisplay = (type: string | undefined) => {
        if (!type) return 'N/A';
        
        switch (type.toUpperCase()) {
            case 'INBOUND':
                return 'Inbound';
            case 'OUTBOUND':
                return 'Outbound';
            case 'TRANSFER':
                return 'Transfer';
            case 'RETURN':
                return 'Return';
            default:
                return type;
        }
    };

    // Count stock items in a shipment
    const countStockItems = (shipment: ShipmentWithRequiredId) => {
        return shipment.stocks?.length || 0;
    };

    // Get warehouse name by ID
    const getWarehouseName = (warehouseId: number | undefined): string => {
        if (warehouseId === undefined) return 'N/A';
        
        const warehouse = warehouses[warehouseId];
        return warehouse ? warehouse.name : `Warehouse #${warehouseId}`;
    };
    
    // Get vehicle info by ID
    const getVehicleName = (vehicleId: number | undefined): string => {
        if (vehicleId === undefined) return 'N/A';
        
        const vehicle = vehicles[vehicleId];
        return vehicle ? vehicle.identificationNumber : `Vehicle #${vehicleId}`;
    };

    const sortedShipments = useMemo(() => {
        if (!shipments) return [];

        return [...shipments].sort((a, b) => {
            switch (sortField) {
                case 'id':
                    return sort === 'ASC' 
                        ? (a.id || 0) - (b.id || 0)
                        : (b.id || 0) - (a.id || 0);
                case 'referenceNumber':
                    return sort === 'ASC'
                        ? (a.referenceNumber || '').localeCompare(b.referenceNumber || '')
                        : (b.referenceNumber || '').localeCompare(a.referenceNumber || '');
                case 'type':
                    return sort === 'ASC'
                        ? (a.type || '').localeCompare(b.type || '')
                        : (b.type || '').localeCompare(a.type || '');
                case 'status':
                    return sort === 'ASC'
                        ? (a.status || '').localeCompare(b.status || '')
                        : (b.status || '').localeCompare(a.status || '');
                case 'createdAt':
                    return sort === 'ASC'
                        ? new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                        : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                default:
                    return 0;
            }
        });
    }, [shipments, sortField, sort]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredShipments = useMemo(() => {
        if (!sortedShipments) return [];

        return sortedShipments.filter(shipment => {
            const matchesSearch = !searchQuery || 
                (shipment.referenceNumber && shipment.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (shipment.id && shipment.id.toString().includes(searchQuery)) ||
                (shipment.type && shipment.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (shipment.status && shipment.status.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesSearch;
        });
    }, [sortedShipments, searchQuery]);

    const paginatedShipments = useMemo(() => {
        if (!filteredShipments) return [];

        const startIndex = page * size;
        return filteredShipments.slice(startIndex, startIndex + size);
    }, [filteredShipments, page, size]);

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Shipments Management</h1>
            
            <div className="flex space-x-4 mb-4">
                <div>
                    <label htmlFor="size" className="border rounded p-1 text-black">Size:</label>
                    <input
                        type="number"
                        id="size"
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        min="1"
                        className="border rounded p-1 text-black"
                    />
                </div>
                <div>
                    <label htmlFor="sortField" className="border rounded p-1 text-black">Sort By:</label>
                    <select
                        id="sortField"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="border rounded p-1 text-black"
                    >
                        <option value="id">ID</option>
                        <option value="referenceNumber">Reference Number</option>
                        <option value="type">Type</option>
                        <option value="status">Status</option>
                        <option value="createdAt">Created Date</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="sort" className="border rounded p-1 text-black">Order:</label>
                    <select
                        id="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="border rounded p-1 text-black"
                    >
                        <option value="ASC">Ascending</option>
                        <option value="DESC">Descending</option>
                    </select>
                </div>
                <button 
                    onClick={fetchShipments} 
                    disabled={isLoading}
                    className="bg-indigo-600 text-white rounded p-1"
                >
                    {isLoading ? 'Loading...' : 'Apply Filters'}
                </button>
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search by reference number" 
                    className="border rounded p-1 text-black"
                />
            </div>
            <div className="pagination mb-4 text-black">
                <button 
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))} 
                    disabled={page === 0 || isLoading} 
                    className="bg-gray-300 rounded p-2 mr-2"
                >
                    Previous
                </button>
                <span className="mx-2 text-black">Page {page + 1} of {Math.ceil(filteredShipments.length / size)}</span>
                <button 
                    onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(filteredShipments.length / size) - 1))} 
                    disabled={page + 1 === Math.ceil(filteredShipments.length / size) || isLoading} 
                    className="bg-gray-300 rounded p-2 ml-2"
                >
                    Next
                </button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <p className="text-black">Loading shipments...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(paginatedShipments) && paginatedShipments.length > 0 ? (
                                paginatedShipments.map((shipment, index) => (
                                    <tr key={shipment.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}> 
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shipment.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.referenceNumber || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getShipmentTypeDisplay(shipment.type)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(shipment.status)}`}>
                                                {shipment.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getWarehouseName(shipment.sourceWarehouseId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getWarehouseName(shipment.destinationWarehouseId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.driverName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getVehicleName(shipment.vehicleId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{countStockItems(shipment)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(shipment.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button 
                                                onClick={() => handleDelete(shipment.id)} 
                                                className={`${deletingShipmentIds.includes(shipment.id) ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                                                disabled={deletingShipmentIds.includes(shipment.id)}
                                            >
                                                {deletingShipmentIds.includes(shipment.id) ? 'Deleting...' : 'Delete'}
                                            </button>
                                            <button 
                                                onClick={() => setSelectedShipment(shipment)} 
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {error ? `Error loading shipments: ${error.message}` : 'No shipments found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedShipment && (
                <ShipmentDetailsModal 
                    shipment={selectedShipment} 
                    warehouses={warehouses}
                    vehicles={vehicles}
                    onClose={() => setSelectedShipment(null)} 
                />
            )}
        </div>
    );
};

export default Shipments;
