'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { searchWarehouses, Warehouse, deleteWarehouse, updateWarehouse } from '../../api/warehouseService';
import AddWarehouse from './AddWarehouse';

// Use the Warehouse interface from warehouseService but ensure id is required
interface WarehouseWithRequiredId extends Omit<Warehouse, 'id'> {
    id: number;
}

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState<WarehouseWithRequiredId[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deletingWarehouseIds, setDeletingWarehouseIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseWithRequiredId | null>(null);
    
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('id');
    const [totalPages, setTotalPages] = useState<number>(0);
    // Total elements used for internal calculations
    const [_totalElements, setTotalElements] = useState<number>(0);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('accessToken');
        setToken(storedToken);
        if (!storedToken) {
            window.location.href = '/login';
        }
    }, []);

    const fetchWarehouses = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await searchWarehouses({
                page,
                size,
                sort,
                sortField
            });
            
            // Filter out any warehouses without an id
            const warehousesWithId = data.content
                .filter((warehouse): warehouse is WarehouseWithRequiredId => 
                    warehouse.id !== undefined
                );
            
            setWarehouses(warehousesWithId);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            setError(error as Error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, size, sort, sortField]);

    useEffect(() => {
        if (token) {
            fetchWarehouses();
        }
    }, [token, fetchWarehouses]);

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this warehouse?');
        if (confirmed) {
            // Add warehouse ID to the deleting list
            setDeletingWarehouseIds(prev => [...prev, id]);
            
            try {
                await deleteWarehouse(id);
                // Remove warehouse from the list without refetching to improve performance
                setWarehouses(prev => prev.filter(warehouse => warehouse.id !== id));
                // Show success message
                const warehouseName = warehouses.find(w => w.id === id)?.name || `Warehouse #${id}`;
                alert(`${warehouseName} has been deleted successfully.`);
            } catch (error) {
                console.error('Error deleting warehouse:', error);
                // Show detailed error message
                const errorMessage = (error as Error).message || 'An unknown error occurred';
                alert(`Failed to delete warehouse: ${errorMessage}`);
                
                // Log additional details for debugging
                console.error('Delete warehouse error details:', {
                    warehouseId: id,
                    timestamp: new Date().toISOString(),
                    error
                });
            } finally {
                // Remove warehouse ID from the deleting list
                setDeletingWarehouseIds(prev => prev.filter(wid => wid !== id));
                // Refresh the warehouse list to ensure data consistency
                fetchWarehouses();
            }
        }
    };

    const handleEditWarehouse = (warehouse: WarehouseWithRequiredId) => {
        setSelectedWarehouse(warehouse);
        setIsModalOpen(true);
    };

    const handleWarehouseAdded = () => {
        fetchWarehouses(); // Refresh the warehouse list after adding a new warehouse
        setSelectedWarehouse(null); // Reset selected warehouse
    };

    // Format date to a more readable format
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="p-4 bg-white min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Warehouses Management</h1>
            <button onClick={() => {
                setSelectedWarehouse(null);
                setIsModalOpen(true);
            }} className="bg-indigo-600 text-white rounded-md px-4 py-2 mb-4 hover:bg-indigo-700 transition-colors">Add Warehouse</button>
            {isModalOpen && (
                <AddWarehouse 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onWarehouseAdded={handleWarehouseAdded} 
                    existingWarehouse={selectedWarehouse || undefined}
                />
            )}
            
            <div className="flex space-x-4 mb-4">
                <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Size:</label>
                    <input
                        type="number"
                        id="size"
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        min="1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                </div>
                <div>
                    <label htmlFor="sortField" className="block text-sm font-medium text-gray-700 mb-1">Sort By:</label>
                    <select
                        id="sortField"
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value="id">ID</option>
                        <option value="name">Name</option>
                        <option value="location">Location</option>
                        <option value="createdAt">Created Date</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Order:</label>
                    <select
                        id="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                        <option value="ASC">Ascending</option>
                        <option value="DESC">Descending</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={fetchWarehouses} 
                        disabled={isLoading}
                        className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                    >
                        {isLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>
            </div>
            <div className="pagination mb-4 flex items-center justify-start text-gray-900">
                <button 
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))} 
                    disabled={page === 0 || isLoading} 
                    className="bg-gray-200 text-gray-800 rounded-md px-4 py-2 mr-2 hover:bg-gray-300 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="mx-2 text-gray-900 font-medium">Page {page + 1} of {totalPages}</span>
                <button 
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} 
                    disabled={page + 1 === totalPages || isLoading} 
                    className="bg-gray-200 text-gray-800 rounded-md px-4 py-2 ml-2 hover:bg-gray-300 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <p className="text-gray-900 text-lg">Loading warehouses...</p>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error.message}</span>
                </div>
            ) : warehouses.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-600 text-lg">No warehouses found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {warehouses.map((warehouse) => (
                                <tr key={warehouse.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{warehouse.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warehouse.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warehouse.location || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(warehouse.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button 
                                            onClick={() => handleEditWarehouse(warehouse)}
                                            className="bg-indigo-600 text-white rounded-md px-3 py-1 hover:bg-indigo-700 transition-colors"
                                        >
                                            Edit    
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(warehouse.id)}
                                            className="bg-red-600 text-white rounded-md px-3 py-1 hover:bg-red-700 transition-colors"
                                            disabled={deletingWarehouseIds.includes(warehouse.id)}
                                        >
                                            {deletingWarehouseIds.includes(warehouse.id) ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Warehouses;
