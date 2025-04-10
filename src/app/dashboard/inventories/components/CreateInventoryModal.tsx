'use client';

import React, { useState, useEffect } from 'react';
import { createInventoryItem } from '@/app/api/inventoryService';
import { getProducts } from '@/app/api/productService';
import { toast } from 'react-toastify';
import { Product } from '@/types/product';

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryCreated?: () => void;
}

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({ 
  isOpen, 
  onClose,
  onInventoryCreated 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [containerNumber, setContainerNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        // Transform and validate products
        const validProducts: Product[] = (fetchedProducts.items || [])
          .filter(p => p.id !== undefined)
          .map(p => ({
            id: p.id!,
            name: p.name || '',
            code: p.code || ''
          }));
        
        setProducts(validProducts);
      } catch (error) {
        toast.error('Failed to fetch products');
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    setIsLoading(true);

    try {
      const inventoryData = {
        productId: selectedProductId,
        quantity: quantity,
        items: [{
          serialNumber: serialNumber,
          batch: {
            number: batchNumber
          },
          container: {
            number: containerNumber
          }
        }],
        bl: {
          number: batchNumber
        },
        containers: [{
          number: containerNumber
        }]
      };

      await createInventoryItem(inventoryData);
      
      toast.success('Inventory created successfully');
      onInventoryCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create inventory');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Create Inventory</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700">Product</label>
            <select
              id="product"
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
            <input
              type="text"
              id="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">Batch Number</label>
            <input
              type="text"
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label htmlFor="containerNumber" className="block text-sm font-medium text-gray-700">Container Number</label>
            <input
              type="text"
              id="containerNumber"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
