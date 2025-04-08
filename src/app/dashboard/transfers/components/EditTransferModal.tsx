'use client';

import React, { useState, useEffect } from 'react';
import { getTransferById, updateTransfer } from '@/app/api/transferService';
import { getWarehouses } from '@/app/api/warehouseService';
import { getProducts } from '@/app/api/productService';
import { Transfer, TransferStock } from '@/types/transfer';
import { Product } from '@/types/product';
import { Warehouse } from '@/types/transfer';

interface EditTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: Transfer;
  onTransferUpdated: () => void;
}

const EditTransferModal: React.FC<EditTransferModalProps> = ({ 
  isOpen, 
  onClose, 
  transfer,
  onTransferUpdated 
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceWarehouseId, setSourceWarehouseId] = useState(transfer.sourceWarehouse.id);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(transfer.destinationWarehouse.id);
  const [transferType, setTransferType] = useState(transfer.type);
  const [transferDate, setTransferDate] = useState(transfer.date);
  const [description, setDescription] = useState(transfer.description);

  const [stocks, setStocks] = useState<{ quantity: number; productId: number }[]>(
    transfer.stocks.map(stock => ({
      quantity: stock.quantity,
      productId: stock.id.productId
    }))
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [warehousesResponse, productsResponse] = await Promise.all([
          getWarehouses(),
          getProducts()
        ]);
        
        setWarehouses(warehousesResponse);
        setProducts(productsResponse);
      } catch (err) {
        setError('Failed to fetch initial data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const handleUpdateTransfer = async () => {
    if (!sourceWarehouseId || !destinationWarehouseId || stocks.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateTransfer(transfer.id, {
        number: transfer.number,
        type: transferType,
        date: transferDate,
        description,
        sourceWarehouseId,
        destinationWarehouseId,
        stocks: stocks.map(stock => ({
          productId: stock.productId,
          quantity: stock.quantity
        }))
      });

      onTransferUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating transfer:', err);
      setError('Failed to update transfer');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = (index: number, field: 'quantity' | 'productId', value: number) => {
    const newStocks = [...stocks];
    newStocks[index] = {
      ...newStocks[index],
      [field]: value
    };
    setStocks(newStocks);
  };

  const addStock = () => {
    setStocks([...stocks, { quantity: 0, productId: 0 }]);
  };

  const removeStock = (index: number) => {
    const newStocks = stocks.filter((_, i) => i !== index);
    setStocks(newStocks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Transfer {transfer.number}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Type
            </label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="INTERNAL">Internal</option>
              <option value="EXTERNAL">External</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Warehouse
              </label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Warehouse
              </label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Date
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Transfer Stocks
              </label>
              <button
                onClick={addStock}
                className="text-indigo-600 hover:text-indigo-800"
              >
                + Add Stock
              </button>
            </div>

            {stocks.map((stock, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                <select
                  value={stock.productId}
                  onChange={(e) => updateStock(index, 'productId', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={0}>Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={stock.quantity}
                  onChange={(e) => updateStock(index, 'quantity', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />

                <button
                  onClick={() => removeStock(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-4">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateTransfer}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransferModal;
