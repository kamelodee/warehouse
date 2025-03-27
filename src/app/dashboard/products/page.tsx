'use client';
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { searchProducts, deleteProduct, Product } from '../../api/productService';
import dynamic from 'next/dynamic';

// Dynamically import components with loading fallbacks
const AddProduct = dynamic(() => import('./AddProduct'), {
  loading: () => <div className="p-4 border rounded shadow-sm">Loading add product form...</div>,
  ssr: false
});

const EditProduct = dynamic(() => import('./EditProduct'), {
  loading: () => <div className="p-4 border rounded shadow-sm">Loading edit form...</div>,
  ssr: false
});

const ExcelUpload = dynamic(() => import('./ExcelUpload'), {
  loading: () => <div className="p-4 border rounded shadow-sm">Loading Excel upload...</div>,
  ssr: false
});

const DownloadTemplate = dynamic(() => import('./DownloadTemplate'), {
  loading: () => <div className="p-2 border rounded">Loading template...</div>,
  ssr: false
});

// Use the Product interface from productService but ensure id is required
interface ProductWithRequiredId extends Omit<Product, 'id'> {
    id: number;
}

const Products = () => {
    const [products, setProducts] = useState<ProductWithRequiredId[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false); // Edit modal state
    const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState<boolean>(false); // Excel upload modal state
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null); // Selected product for editing
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deletingProductIds, setDeletingProductIds] = useState<number[]>([]); // Track products being deleted
    const [isUploading, setIsUploading] = useState<boolean>(false); // Track if an Excel upload is in progress
   
    // State variables for pagination and sorting
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [sort, setSort] = useState<string>('ASC');
    const [sortField, setSortField] = useState<string>('name');
    const [totalPages, setTotalPages] = useState<number>(0);
    // Total elements used for internal calculations
    const [_totalElements, setTotalElements] = useState<number>(0); // eslint-disable-line @typescript-eslint/no-unused-vars
    // Kept for potential future use in pagination calculations

    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        setToken(storedToken);
        if (!storedToken) {
            window.location.href = '/login';
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const data = await searchProducts({
                page,
                size,
                sort,
                sortField
            });
            
            // Filter out any products without an id
            const productsWithId = data.content
                .filter((product): product is ProductWithRequiredId => 
                    product.id !== undefined
                );
            
            setProducts(productsWithId);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error as Error);
        } finally {
            setIsLoading(false);
        }
    }, [token, page, size, sort, sortField]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEdit = (id: number) => {
        setSelectedProductId(id);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm('Are you sure you want to delete this product?');
        if (confirmed) {
            // Add product ID to the deleting list
            setDeletingProductIds(prev => [...prev, id]);
            
            try {
                await deleteProduct(id);
                // Remove product from the list without refetching to improve performance
                setProducts(prev => prev.filter(product => product.id !== id));
                // Show success message
                const productName = products.find(p => p.id === id)?.name || 'Product';
                alert(`${productName} has been deleted successfully.`);
            } catch (error) {
                console.error('Error deleting product:', error);
                // Show detailed error message
                const errorMessage = (error as Error).message || 'An unknown error occurred';
                alert(`Failed to delete product: ${errorMessage}`);
                
                // Log additional details for debugging
                console.error('Delete product error details:', {
                    productId: id,
                    timestamp: new Date().toISOString(),
                    error
                });
            } finally {
                // Remove product ID from the deleting list
                setDeletingProductIds(prev => prev.filter(pid => pid !== id));
                // Refresh the product list to ensure data consistency
                fetchProducts();
            }
        }
    };

    const handleProductAdded = () => {
        fetchProducts(); // Refresh the product list after adding a new product
    };

    const handleProductUpdated = () => {
        fetchProducts(); // Refresh the product list after updating a product
    };

    const handleExcelUpload = () => {
        setIsExcelUploadModalOpen(true);
    };

    const handleProductsUploaded = () => {
        // Refetch products after successful upload
        fetchProducts();
        setIsUploading(false);
    };

    const handleUploadStart = () => {
        setIsUploading(true);
    };

    const handleUploadError = () => {
        setIsUploading(false);
    };

    return (
        <div className="p-4">
            <h1 className="text-black font-bold mb-4">Products Management</h1>
            <div className="flex space-x-2 mb-4">
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white rounded p-2">Add Product</button>
                <button 
                    onClick={handleExcelUpload} 
                    className={`${isUploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
                    disabled={isUploading}
                >
                    {isUploading ? 'Upload in Progress...' : 'Excel Upload'}
                </button>
                <DownloadTemplate 
                    variant="button" 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md" 
                />
            </div>
            <Suspense fallback={<div>Loading...</div>}>
                <AddProduct 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onProductAdded={handleProductAdded} 
                />
                <EditProduct
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    productId={selectedProductId}
                    onProductUpdated={handleProductUpdated}
                />
                <ExcelUpload
                    isOpen={isExcelUploadModalOpen}
                    onClose={() => setIsExcelUploadModalOpen(false)}
                    onProductsUploaded={handleProductsUploaded}
                    onUploadStart={handleUploadStart}
                    onUploadError={handleUploadError}
                />
            </Suspense>
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
                <button 
                    onClick={fetchProducts} 
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
                    <p className="text-black">Loading products...</p>
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {product.imageUrl ? (
                                            <img 
                                                src={product.imageUrl} 
                                                alt={product.name} 
                                                className="h-16 w-16 object-cover rounded-md"
                                                onError={(e) => {
                                                    // Handle image loading errors
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="h-16 w-16 bg-gray-200 flex items-center justify-center rounded-md text-gray-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.barcode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.serialized ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button 
                                            onClick={() => handleEdit(product.id)} 
                                            className="text-blue-500 hover:text-blue-700 mr-2"
                                            disabled={deletingProductIds.includes(product.id)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(product.id)} 
                                            className={`${deletingProductIds.includes(product.id) ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                                            disabled={deletingProductIds.includes(product.id)}
                                        >
                                            {deletingProductIds.includes(product.id) ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    {error ? `Error loading products: ${error.message}` : 'No products found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Products;