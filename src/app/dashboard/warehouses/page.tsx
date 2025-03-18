'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { searchWarehouses, Warehouse, deleteWarehouse } from '../../api/warehouseService';
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
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('id');
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);

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

    const handleWarehouseAdded = () => {
        fetchWarehouses(); // Refresh the warehouse list after adding a new warehouse
    };

    // Format date to a more readable format
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Warehouses Management</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white rounded p-2 mb-4">Add Warehouse</button>
            {isModalOpen && (
                <AddWarehouse 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onWarehouseAdded={handleWarehouseAdded} 
                />
            )}
            
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
                        <option value="name">Name</option>
                        <option value="location">Location</option>
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
                    onClick={fetchWarehouses} 
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
                    <p className="text-black">Loading warehouses...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(warehouses) && warehouses.length > 0 ? (
                                warehouses.map((warehouse, index) => (
                                    <tr key={warehouse.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}> 
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{warehouse.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warehouse.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warehouse.location || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(warehouse.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(warehouse.updatedAt)}</td>
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
                                                onClick={() => handleDelete(warehouse.id)} 
                                                className={`${deletingWarehouseIds.includes(warehouse.id) ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                                                disabled={deletingWarehouseIds.includes(warehouse.id)}
                                            >
                                                {deletingWarehouseIds.includes(warehouse.id) ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {error ? `Error loading warehouses: ${error.message}` : 'No warehouses found'}
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

export default Warehouses;
