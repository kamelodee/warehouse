'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AddProduct from './AddProduct'; // Importing the AddProduct component

interface Product {
    id: number;
    name: string;
    code: string;
    barcode: string;
    serialized: boolean;
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Modal state
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('name');
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('accessToken');
        setToken(storedToken);
        if (!storedToken) {
            window.location.href = '/login';
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`http://stock.hisense.com.gh/api/v1.0/products/search?page=${page}&size=${size}&sort=${sort}&sortField=${sortField}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setProducts(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error as Error);
        }
    }, [token, page, size, sort, sortField]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEdit = (id: number) => {
        // Logic to handle editing a product
        console.log(`Edit product with id: ${id}`);
        // Redirect to edit page or open a modal for editing
    };

    const handleDelete = async (id: number) => {
        // Logic to handle deleting a product
        const confirmed = window.confirm('Are you sure you want to delete this product?');
        if (confirmed) {
            try {
                const response = await fetch(`http://stock.hisense.com.gh/api/v1.0/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    fetchProducts(); // Refresh the product list after deletion
                } else {
                    console.error('Failed to delete product');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        }
    };

    const handleProductAdded = () => {
        fetchProducts(); // Refresh the product list after adding a new product
    };

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Products Management</h1>
            <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white rounded p-2 mb-4">Add Product</button>
            <AddProduct 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onProductAdded={handleProductAdded} 
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
                        <option value="name">Name</option>
                        <option value="code">Code</option>
                        <option value="barcode">Barcode</option>
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
                <button onClick={fetchProducts} className="bg-indigo-600 text-white rounded p-1">Apply Filters</button>
            </div>
            <div className="pagination mb-4 text-black">
                <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0} className="bg-gray-300 rounded p-2 mr-2">Previous</button>
                <span className="mx-2 text-black">Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} disabled={page + 1 === totalPages} className="bg-gray-300 rounded p-2 ml-2">Next</button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serialized</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(products) && products.length > 0 ? (
                        products.map((product, index) => (
                            <tr key={product.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}> 
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.barcode}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.serialized ? 'Yes' : 'No'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button 
                                        onClick={() => handleEdit(product.id)} 
                                        className="text-blue-500 hover:text-blue-700 mr-2"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(product.id)} 
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                {error ? 'Error loading products' : 'No products found'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Products;