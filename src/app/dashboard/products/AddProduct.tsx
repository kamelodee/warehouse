import React, { useState } from 'react';

interface AddProductProps {
    isOpen: boolean;
    onClose: () => void;
    onProductAdded?: () => void;
}

const AddProduct = ({ isOpen, onClose, onProductAdded }: AddProductProps) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [serialized, setSerialized] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const token = sessionStorage.getItem('accessToken'); // Retrieve the token
        if (!token) {
            alert('Access token is not available. Please log in again.');
            setIsLoading(false);
            return;
        }

        const payload = {
            code,
            name,
            barcode,
            serialized
        };

        try {
            const response = await fetch('http://stock.hisense.com.gh/api/v1.0/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include token in headers
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to add product');
            }

            const data = await response.json();
            console.log('Product added:', data);
            alert('Product added successfully!');
            
            // Reset form fields
            setCode('');
            setName('');
            setBarcode('');
            setSerialized(true);
            
            // Close modal and notify parent component
            onClose();
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add Product</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="code" className="block text-gray-700">Product Code</label>
                        <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700">Product Name</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="barcode" className="block text-gray-700">Barcode</label>
                        <input type="text" id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required className="mt-1 block w-full border rounded-md p-2" />
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input type="checkbox" checked={serialized} onChange={(e) => setSerialized(e.target.checked)} className="mr-2" />
                            Serialized
                        </label>
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
                            {isLoading ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;
