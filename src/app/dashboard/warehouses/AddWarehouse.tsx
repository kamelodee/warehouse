import React, { useState } from 'react';
import { createWarehouse } from '../../api/warehouseService';

interface AddWarehouseProps {
    isOpen: boolean;
    onClose: () => void;
    onWarehouseAdded?: () => void;
}

const AddWarehouse = ({ isOpen, onClose, onWarehouseAdded }: AddWarehouseProps) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!name.trim()) {
            newErrors.name = 'Warehouse name is required';
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

        const payload = {
            name: name.trim(),
            location: location.trim() || undefined
        };

        try {
            const data = await createWarehouse(payload);
            console.info('Warehouse added:', data);
            alert('Warehouse added successfully!');
            
            // Reset form fields
            setName('');
            setLocation('');
            setErrors({});
            
            // Close modal and notify parent component
            onClose();
            if (onWarehouseAdded) {
                onWarehouseAdded();
            }
        } catch (error) {
            console.error('Error adding warehouse:', error);
            
            // Log detailed error information
            console.error('Add warehouse error details:', {
                warehouseData: payload,
                timestamp: new Date().toISOString(),
                error
            });
            
            alert('Error adding warehouse: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add Warehouse</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700">Warehouse Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className={`mt-1 block w-full border rounded-md p-2 ${errors.name ? 'border-red-500' : ''}`} 
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="location" className="block text-gray-700">Location (Optional)</label>
                        <input 
                            type="text" 
                            id="location" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            className="mt-1 block w-full border rounded-md p-2"
                        />
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
                            {isLoading ? 'Adding...' : 'Add Warehouse'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWarehouse;
