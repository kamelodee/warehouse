import React, { useState } from 'react';
import { Vehicle, createVehicle } from '../../api/vehicleService';

interface AddVehicleProps {
    isOpen: boolean;
    onClose: () => void;
    onVehicleAdded?: () => void;
}

const AddVehicle = ({ isOpen, onClose, onVehicleAdded }: AddVehicleProps) => {
    const [code, setCode] = useState('');
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!code.trim()) {
            newErrors.code = 'Code is required';
        }
        
        if (!identificationNumber.trim()) {
            newErrors.identificationNumber = 'Identification number is required';
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
            code: code.trim(),
            identificationNumber: identificationNumber.trim()
        };

        try {
            const data = await createVehicle(payload);
            console.info('Vehicle added:', data);
            alert('Vehicle added successfully!');
            
            // Reset form fields
            setCode('');
            setIdentificationNumber('');
            setErrors({});
            
            // Close modal and notify parent component
            onClose();
            if (onVehicleAdded) {
                onVehicleAdded();
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            
            // Log detailed error information
            console.error('Add vehicle error details:', {
                vehicleData: payload,
                timestamp: new Date().toISOString(),
                error
            });
            
            alert('Error adding vehicle: ' + (error as Error).message);
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
                    <h2 className="text-2xl font-bold">Add Vehicle</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="code" className="block text-gray-700">Code</label>
                        <input 
                            type="text" 
                            id="code" 
                            value={code} 
                            onChange={(e) => setCode(e.target.value)} 
                            className={`mt-1 block w-full border rounded-md p-2 ${errors.code ? 'border-red-500' : ''}`} 
                        />
                        {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="identificationNumber" className="block text-gray-700">Identification Number</label>
                        <input 
                            type="text" 
                            id="identificationNumber" 
                            value={identificationNumber} 
                            onChange={(e) => setIdentificationNumber(e.target.value)} 
                            className={`mt-1 block w-full border rounded-md p-2 ${errors.identificationNumber ? 'border-red-500' : ''}`} 
                        />
                        {errors.identificationNumber && <p className="text-red-500 text-sm mt-1">{errors.identificationNumber}</p>}
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md mr-2"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVehicle;
