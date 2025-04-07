import React, { useState, useEffect } from 'react';
import { createTransfer } from '@/app/api/transferService';
import { CreateTransferPayload } from '@/types/transfer';
import { getWarehouses } from '@/app/api/warehouseService';
import { getProducts } from '@/app/api/productService';
import { Warehouse } from '@/types/warehouse';
import { Product } from '@/types/product';

interface CreateTransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTransferModal: React.FC<CreateTransferModalProps> = ({ onClose, onSuccess }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<CreateTransferPayload>({
    number: '',
    type: 'standard',
    date: new Date().toISOString().split('T')[0],
    description: '',
    sourceWarehouseId: 0,
    destinationWarehouseId: 0,
    stocks: [{ quantity: 0, productId: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const warehousesResponse = await getWarehouses();
        const productsResponse = await getProducts();
        setWarehouses(warehousesResponse.items);
        setProducts(productsResponse.items);
      } catch (err) {
        setError('Failed to load initial data');
      }
    };
    fetchInitialData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sourceWarehouseId' || name === 'destinationWarehouseId' || name === 'stocks.0.productId' 
        ? Number(value) 
        : value
    }));
  };

  const handleStockChange = (index: number, field: string, value: string) => {
    const updatedStocks = [...formData.stocks];
    updatedStocks[index] = {
      ...updatedStocks[index],
      [field]: field === 'productId' ? Number(value) : Number(value)
    };
    setFormData(prev => ({ ...prev, stocks: updatedStocks }));
  };

  const addStockItem = () => {
    setFormData(prev => ({
      ...prev,
      stocks: [...prev.stocks, { quantity: 0, productId: 0 }]
    }));
  };

  const removeStockItem = (index: number) => {
    const updatedStocks = formData.stocks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, stocks: updatedStocks }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createTransfer(formData);
      onSuccess();
    } catch (err) {
      setError('Failed to create transfer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-gray-900 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Create Transfer</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} id="transfer-form">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Transfer Number</label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                >
                  <option value="standard">Standard</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block mb-2">Source Warehouse</label>
                <select
                  name="sourceWarehouseId"
                  value={formData.sourceWarehouseId}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select Source Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Destination Warehouse</label>
                <select
                  name="destinationWarehouseId"
                  value={formData.destinationWarehouseId}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select Destination Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Transfer Stocks</h3>
              {formData.stocks.map((stock, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block mb-1">Product</label>
                    <select
                      value={stock.productId}
                      onChange={(e) => handleStockChange(index, 'productId', e.target.value)}
                      className="w-full border rounded p-2"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={stock.quantity}
                      onChange={(e) => handleStockChange(index, 'quantity', e.target.value)}
                      className="w-full border rounded p-2"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeStockItem(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addStockItem}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 mt-2"
              >
                Add Stock Item
              </button>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="transfer-form"
            disabled={loading}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTransferModal;
