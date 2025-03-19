import React, { useState, useEffect } from 'react';
import { createShipment, Shipment, ShipmentStock } from '../../api/shipmentService';
import { searchWarehouses, Warehouse } from '../../api/warehouseService';
import { searchProducts, Product } from '../../api/productService';
import { searchVehicles, Vehicle } from '../../api/vehicleService';

interface AddShipmentProps {
    isOpen: boolean;
    onClose: () => void;
    onShipmentAdded?: () => void;
}

const AddShipment = ({ isOpen, onClose, onShipmentAdded }: AddShipmentProps) => {
    const [sourceWarehouseId, setSourceWarehouseId] = useState<number>(0);
    const [destinationWarehouseId, setDestinationWarehouseId] = useState<number>(0);
    const [driverName, setDriverName] = useState('');
    const [vehicleId, setVehicleId] = useState<number>(0);
    const [reference, setReference] = useState('');
    const [type, setType] = useState('INBOUND');
    const [status, setStatus] = useState('PENDING');
    const [notes, setNotes] = useState('');
    const [stocks, setStocks] = useState<ShipmentStock[]>([]);
    const [productId, setProductId] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Add state for warehouses
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [warehouseError, setWarehouseError] = useState<string | null>(null);
    
    // Add state for products
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [productError, setProductError] = useState<string | null>(null);
    
    // Add state for vehicles
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
    const [vehicleError, setVehicleError] = useState<string | null>(null);

    // Fetch warehouses, products, and vehicles when the component mounts
    useEffect(() => {
        if (isOpen) {
            fetchWarehouses();
            fetchProducts();
            fetchVehicles();
        }
    }, [isOpen]);

    // Function to fetch warehouses from the API
    const fetchWarehouses = async () => {
        setIsLoadingWarehouses(true);
        setWarehouseError(null);
        
        try {
            const response = await searchWarehouses({
                page: 0,
                size: 100, // Get a larger number to show all warehouses
                sort: 'ASC',
                sortField: 'name'
            });
            
            setWarehouses(response.content);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
            setWarehouseError('Failed to load warehouses. Please try again.');
        } finally {
            setIsLoadingWarehouses(false);
        }
    };
    
    // Function to fetch products from the API
    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setProductError(null);
        
        try {
            const response = await searchProducts({
                page: 0,
                size: 100, // Get a larger number to show all products
                sort: 'ASC',
                sortField: 'name'
            });
            
            setProducts(response.content);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProductError('Failed to load products. Please try again.');
        } finally {
            setIsLoadingProducts(false);
        }
    };
    
    // Function to fetch vehicles from the API
    const fetchVehicles = async () => {
        setIsLoadingVehicles(true);
        setVehicleError(null);
        
        try {
            const response = await searchVehicles({
                page: 0,
                size: 100, // Get a larger number to show all vehicles
                sort: 'ASC',
                sortField: 'identificationNumber'
            });
            
            setVehicles(response.content);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setVehicleError('Failed to load vehicles. Please try again.');
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    // Add a stock item to the stocks array
    const addStockItem = () => {
        if (!productId) {
            setErrors(prev => ({ ...prev, productId: 'Product is required' }));
            return;
        }
        
        if (quantity <= 0) {
            setErrors(prev => ({ ...prev, quantity: 'Quantity must be greater than 0' }));
            return;
        }
        
        // Check if this product is already in the stocks array
        const existingStockIndex = stocks.findIndex(stock => stock.productId === productId);
        
        if (existingStockIndex >= 0) {
            // Update existing stock item
            const updatedStocks = [...stocks];
            updatedStocks[existingStockIndex].quantity += quantity;
            setStocks(updatedStocks);
        } else {
            // Add new stock item
            const newStock: ShipmentStock = {
                productId,
                quantity,
                productSerialNumbers: []
            };
            
            setStocks(prev => [...prev, newStock]);
        }
        
        setProductId(0);
        setQuantity(0);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.productId;
            delete newErrors.quantity;
            return newErrors;
        });
    };

    // Remove a stock item from the stocks array
    const removeStockItem = (index: number) => {
        setStocks(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (sourceWarehouseId <= 0) {
            newErrors.sourceWarehouseId = 'Source Warehouse is required';
        }
        
        if (destinationWarehouseId <= 0) {
            newErrors.destinationWarehouseId = 'Destination Warehouse is required';
        }
        
        if (sourceWarehouseId === destinationWarehouseId && sourceWarehouseId !== 0) {
            newErrors.destinationWarehouseId = 'Source and Destination Warehouses cannot be the same';
        }
        
        if (!driverName.trim()) {
            newErrors.driverName = 'Driver Name is required';
        }
        
        if (vehicleId <= 0) {
            newErrors.vehicleId = 'Vehicle is required';
        }
        
        if (stocks.length === 0) {
            newErrors.stocks = 'At least one stock item is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);

        const payload: Shipment = {
            sourceWarehouseId,
            destinationWarehouseId,
            driverName,
            vehicleId,
            stocks,
            reference: reference.trim() || undefined,
            type: type || undefined,
            status: status || undefined,
            notes: notes.trim() || undefined
        };

        try {
            const data = await createShipment(payload);
            console.info('Shipment added:', data);
            alert('Shipment added successfully!');
            
            // Reset form fields
            setSourceWarehouseId(0);
            setDestinationWarehouseId(0);
            setDriverName('');
            setVehicleId(0);
            setReference('');
            setType('INBOUND');
            setStatus('PENDING');
            setNotes('');
            setStocks([]);
            setErrors({});
            
            // Close modal and notify parent component
            onClose();
            if (onShipmentAdded) {
                onShipmentAdded();
            }
        } catch (error) {
            console.error('Error adding shipment:', error);
            console.log(payload)
            // Log detailed error information
            console.error('Add shipment error details:', {
                shipmentData: payload,
                timestamp: new Date().toISOString(),
                error
            });
            
            alert('Error adding shipment: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Get product name by ID
    const getProductName = (productId: number): string => {
        const product = products.find(p => p.id === productId);
        return product ? `${product.name} (${product.code})` : `Product #${productId}`;
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add Shipment</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="sourceWarehouseId" className="block text-gray-700">Source Warehouse</label>
                            {isLoadingWarehouses ? (
                                <div className="mt-1 p-2 border rounded-md">Loading warehouses...</div>
                            ) : warehouseError ? (
                                <div className="mt-1 p-2 border rounded-md text-red-500">{warehouseError}</div>
                            ) : (
                                <select 
                                    id="sourceWarehouseId" 
                                    value={sourceWarehouseId} 
                                    onChange={(e) => setSourceWarehouseId(Number(e.target.value))} 
                                    className={`mt-1 block w-full border rounded-md p-2 ${errors.sourceWarehouseId ? 'border-red-500' : ''}`}
                                >
                                    <option value={0}>Select Source Warehouse</option>
                                    {warehouses.map(warehouse => (
                                        <option key={`source-${warehouse.id}`} value={warehouse.id}>
                                            {warehouse.name} {warehouse.location ? `(${warehouse.location})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.sourceWarehouseId && <p className="text-red-500 text-sm mt-1">{errors.sourceWarehouseId}</p>}
                        </div>
                        <div>
                            <label htmlFor="destinationWarehouseId" className="block text-gray-700">Destination Warehouse</label>
                            {isLoadingWarehouses ? (
                                <div className="mt-1 p-2 border rounded-md">Loading warehouses...</div>
                            ) : warehouseError ? (
                                <div className="mt-1 p-2 border rounded-md text-red-500">{warehouseError}</div>
                            ) : (
                                <select 
                                    id="destinationWarehouseId" 
                                    value={destinationWarehouseId} 
                                    onChange={(e) => setDestinationWarehouseId(Number(e.target.value))} 
                                    className={`mt-1 block w-full border rounded-md p-2 ${errors.destinationWarehouseId ? 'border-red-500' : ''}`}
                                >
                                    <option value={0}>Select Destination Warehouse</option>
                                    {warehouses.map(warehouse => (
                                        <option key={`dest-${warehouse.id}`} value={warehouse.id}>
                                            {warehouse.name} {warehouse.location ? `(${warehouse.location})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.destinationWarehouseId && <p className="text-red-500 text-sm mt-1">{errors.destinationWarehouseId}</p>}
                        </div>
                        <div>
                            <label htmlFor="driverName" className="block text-gray-700">Driver Name</label>
                            <input 
                                type="text" 
                                id="driverName" 
                                value={driverName} 
                                onChange={(e) => setDriverName(e.target.value)} 
                                className={`mt-1 block w-full border rounded-md p-2 ${errors.driverName ? 'border-red-500' : ''}`} 
                            />
                            {errors.driverName && <p className="text-red-500 text-sm mt-1">{errors.driverName}</p>}
                        </div>
                        <div>
                            <label htmlFor="vehicleId" className="block text-gray-700">Vehicle</label>
                            {isLoadingVehicles ? (
                                <div className="mt-1 p-2 border rounded-md">Loading vehicles...</div>
                            ) : vehicleError ? (
                                <div className="mt-1 p-2 border rounded-md text-red-500">{vehicleError}</div>
                            ) : (
                                <select 
                                    id="vehicleId" 
                                    value={vehicleId} 
                                    onChange={(e) => setVehicleId(Number(e.target.value))} 
                                    className={`mt-1 block w-full border rounded-md p-2 ${errors.vehicleId ? 'border-red-500' : ''}`}
                                >
                                    <option value={0}>Select Vehicle</option>
                                    {vehicles.map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.identificationNumber}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.vehicleId && <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>}
                        </div>
                        <div>
                            <label htmlFor="reference" className="block text-gray-700">Reference (Optional)</label>
                            <input 
                                type="text" 
                                id="reference" 
                                value={reference} 
                                onChange={(e) => setReference(e.target.value)} 
                                className="mt-1 block w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-gray-700">Type (Optional)</label>
                            <select 
                                id="type" 
                                value={type} 
                                onChange={(e) => setType(e.target.value)}
                                className="mt-1 block w-full border rounded-md p-2"
                            >
                                <option value="INBOUND">Inbound</option>
                                <option value="OUTBOUND">Outbound</option>
                                <option value="TRANSFER">Transfer</option>
                                <option value="RETURN">Return</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-gray-700">Status (Optional)</label>
                            <select 
                                id="status" 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block w-full border rounded-md p-2"
                            >
                                <option value="PENDING">Pending</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-gray-700">Notes (Optional)</label>
                            <textarea 
                                id="notes" 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                className="mt-1 block w-full border rounded-md p-2"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Stock Items</h3>
                        {errors.stocks && <p className="text-red-500 text-sm mb-2">{errors.stocks}</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <div>
                                <label htmlFor="productId" className="block text-gray-700">Product</label>
                                {isLoadingProducts ? (
                                    <div className="mt-1 p-2 border rounded-md">Loading products...</div>
                                ) : productError ? (
                                    <div className="mt-1 p-2 border rounded-md text-red-500">{productError}</div>
                                ) : (
                                    <select 
                                        id="productId" 
                                        value={productId} 
                                        onChange={(e) => setProductId(Number(e.target.value))} 
                                        className={`mt-1 block w-full border rounded-md p-2 ${errors.productId ? 'border-red-500' : ''}`}
                                    >
                                        <option value={0}>Select Product</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.code})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block text-gray-700">Quantity</label>
                                <input 
                                    type="number" 
                                    id="quantity" 
                                    value={quantity || ''} 
                                    onChange={(e) => setQuantity(Number(e.target.value))} 
                                    step="0.01"
                                    className={`mt-1 block w-full border rounded-md p-2 ${errors.quantity ? 'border-red-500' : ''}`} 
                                />
                                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                            </div>
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={addStockItem}
                            className="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600"
                        >
                            Add Stock Item
                        </button>
                        
                        {stocks.length > 0 && (
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {stocks.map((stock, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getProductName(stock.productId)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stock.quantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeStockItem(index)} 
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-gray-300 text-gray-700 rounded-md px-4 py-2 mr-2 hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600"
                        >
                            {isLoading ? 'Adding...' : 'Add Shipment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddShipment;
