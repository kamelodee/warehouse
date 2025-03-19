'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { searchShipments, deleteShipment, Shipment } from '../../api/shipmentService';
import { searchWarehouses, Warehouse } from '../../api/warehouseService';
import { searchVehicles, Vehicle } from '../../api/vehicleService';
import AddShipment from './AddShipment';

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
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [warehouses, setWarehouses] = useState<Record<number, Warehouse>>({});
    // Loading states used in warehouse data fetching
    const [_isLoadingWarehouses, setIsLoadingWarehouses] = useState<boolean>(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [vehicles, setVehicles] = useState<Record<number, Vehicle>>({});
    // Loading states used in vehicle data fetching
    const [_isLoadingVehicles, setIsLoadingVehicles] = useState<boolean>(false); // eslint-disable-line @typescript-eslint/no-unused-vars
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('id');
    const [totalPages, setTotalPages] = useState<number>(0);
    // Total elements used for internal calculations
    const [_totalElements, setTotalElements] = useState<number>(0); // eslint-disable-line @typescript-eslint/no-unused-vars

    useEffect(() => {
        const storedToken = sessionStorage.getItem('accessToken');
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
                size: 100, // Get all warehouses
                sort: 'ASC',
                sortField: 'name'
            });
            
            // Convert array to a map for easier lookup
            const warehouseMap: Record<number, Warehouse> = {};
            data.content.forEach(warehouse => {
                warehouseMap[warehouse.id] = warehouse;
            });
            
            setWarehouses(warehouseMap);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        } finally {
            setIsLoadingWarehouses(false);
        }
    }, [token]);
    
    const fetchVehicles = useCallback(async () => {
        if (!token) return;
        setIsLoadingVehicles(true);
        
        try {
            const data = await searchVehicles({
                page: 0,
                size: 100, // Get all vehicles
                sort: 'ASC',
                sortField: 'identificationNumber'
            });
            
            // Convert array to a map for easier lookup
            const vehicleMap: Record<number, Vehicle> = {};
            data.content.forEach(vehicle => {
                if (vehicle.id !== undefined) {
                    vehicleMap[vehicle.id] = vehicle;
                }
            });
            
            setVehicles(vehicleMap);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setIsLoadingVehicles(false);
        }
    }, [token]);

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
                const shipmentRef = shipments.find(s => s.id === id)?.reference || `Shipment #${id}`;
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

    const handleShipmentAdded = () => {
        fetchShipments(); // Refresh the shipment list after adding a new shipment
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
    const getWarehouseName = (warehouseId: number | undefined) => {
        if (!warehouseId) return 'N/A';
        return warehouses[warehouseId]?.name || `Warehouse #${warehouseId}`;
    };
    
    // Get vehicle info by ID
    const getVehicleInfo = (vehicleId: number | undefined) => {
        if (!vehicleId) return 'N/A';
        const vehicle = vehicles[vehicleId];
        if (!vehicle) return `Vehicle #${vehicleId}`;
        return vehicle.identificationNumber;
    };

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Shipments Management</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white rounded p-2 mb-4">Add Shipment</button>
            <AddShipment 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onShipmentAdded={handleShipmentAdded} 
            />
            
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
                        <option value="reference">Reference</option>
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
            </div>
            <div className="pagination mb-4 text-black">
                <button 
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))} 
                    disabled={page === 0 || isLoading} 
                    className="bg-gray-300 rounded p-2 mr-2"
                >
                    Previous
                </button>
                <span className="mx-2 text-black">Page {page + 1} of {totalPages}</span>
                <button 
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} 
                    disabled={page + 1 === totalPages || isLoading} 
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
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
                            {Array.isArray(shipments) && shipments.length > 0 ? (
                                shipments.map((shipment, index) => (
                                    <tr key={shipment.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}> 
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shipment.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.reference || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getShipmentTypeDisplay(shipment.type)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(shipment.status)}`}>
                                                {shipment.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getWarehouseName(shipment.sourceWarehouseId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getWarehouseName(shipment.destinationWarehouseId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.driverName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getVehicleInfo(shipment.vehicleId)}</td>
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
        </div>
    );
};

export default Shipments;
