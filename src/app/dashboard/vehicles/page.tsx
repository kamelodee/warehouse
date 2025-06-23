'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { searchVehicles, Vehicle, deleteVehicle, refreshVehicles } from '../../api/vehicleService';
import AddVehicle from './AddVehicle';

// Use the Vehicle interface from vehicleService but ensure id is required and add additional properties
interface VehicleWithRequiredId extends Omit<Vehicle, 'id'> {
    id: number;
    type?: string;
    status?: string;
}

const Vehicles = () => {
    const [vehicles, setVehicles] = useState<VehicleWithRequiredId[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deletingVehicleIds, setDeletingVehicleIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('id');
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

    const fetchVehicles = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await searchVehicles({
                page,
                size,
                sort,
                sortField
            });
            
            // Filter out any vehicles without an id
            const vehiclesWithId = data.content
                .filter((vehicle): vehicle is VehicleWithRequiredId => 
                    vehicle.id !== undefined
                );
            
            setVehicles(vehiclesWithId);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setError(error as Error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, size, sort, sortField]);

    useEffect(() => {
        if (token) {
            fetchVehicles();
        }
    }, [token, fetchVehicles]);

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this vehicle?');
        if (confirmed) {
            // Add vehicle ID to the deleting list
            setDeletingVehicleIds(prev => [...prev, id]);
            
            try {
                await deleteVehicle(id);
                // Remove vehicle from the list without refetching to improve performance
                setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
                // Show success message
                const vehicleInfo = vehicles.find(v => v.id === id);
                const vehicleName = vehicleInfo ? 
                    `${vehicleInfo.code} ${vehicleInfo.identificationNumber ? `(${vehicleInfo.identificationNumber})` : ''}` : 
                    `Vehicle #${id}`;
                alert(`${vehicleName} has been deleted successfully.`);
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                // Show detailed error message
                const errorMessage = (error as Error).message || 'An unknown error occurred';
                alert(`Failed to delete vehicle: ${errorMessage}`);
                
                // Log additional details for debugging
                console.error('Delete vehicle error details:', {
                    vehicleId: id,
                    timestamp: new Date().toISOString(),
                    error
                });
            } finally {
                // Remove vehicle ID from the deleting list
                setDeletingVehicleIds(prev => prev.filter(vid => vid !== id));
                // Refresh the vehicle list to ensure data consistency
                fetchVehicles();
            }
        }
    };

    const handleVehicleAdded = () => {
        fetchVehicles(); // Refresh the vehicle list after adding a new vehicle
    };

    const handleRefreshVehicles = async () => {
        setIsRefreshing(true);
        setError(null);
        
        try {
            await refreshVehicles();
            fetchVehicles(); // Refresh the vehicle list after successful refresh
        } catch (error) {
            console.error('Error refreshing vehicles:', error);
            setError(error as Error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Format date to a more readable format (kept for future use)
    const _formatDate = (dateString?: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Vehicles Management</h1>
            <div className="flex space-x-2 mb-4">
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md">Add Vehicle</button>
                <button 
                    onClick={handleRefreshVehicles}
                    className={`${isRefreshing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <AddVehicle 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onVehicleAdded={handleVehicleAdded} 
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
                        <option value="identificationNumber">Identification Number</option>
                        <option value="code">Code</option>
                        <option value="type">Type</option>
                        <option value="status">Status</option>
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
                    onClick={fetchVehicles} 
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
                    <p className="text-black">Loading vehicles...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identification Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(vehicles) && vehicles.length > 0 ? (
                                vehicles.map((vehicle, index) => (
                                    <tr key={vehicle.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}> 
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.identificationNumber || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.type || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                                  vehicle.status === 'INACTIVE' ? 'bg-red-100 text-red-800' : 
                                                  'bg-gray-100 text-gray-800'}`}>
                                                {vehicle.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button 
                                                onClick={() => {
                                                    // Edit functionality would go here
                                                    alert('Edit functionality not implemented yet');
                                                }} 
                                                className="text-blue-500 hover:text-blue-700 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(vehicle.id)} 
                                                className={`${deletingVehicleIds.includes(vehicle.id) ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                                                disabled={deletingVehicleIds.includes(vehicle.id)}
                                            >
                                                {deletingVehicleIds.includes(vehicle.id) ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {error ? `Error loading vehicles: ${error.message}` : 'No vehicles found'}
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

export default Vehicles;
