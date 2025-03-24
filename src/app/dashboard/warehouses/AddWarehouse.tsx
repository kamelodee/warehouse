import React, { useState, useEffect } from 'react';
import { createWarehouse, updateWarehouse, Warehouse } from '../../api/warehouseService';

interface AddWarehouseProps {
    isOpen: boolean;
    onClose: () => void;
    onWarehouseAdded?: () => void;
    existingWarehouse?: Warehouse; // Optional existing warehouse for editing
}

interface EmailEntry {
    email: string;
}

// Extend Warehouse interface to include emails
interface WarehouseWithEmails extends Warehouse {
    emails?: { email: string }[];
}

// Custom type for warehouse creation/update payload
interface WarehousePayload {
    name: string;
    location?: string;
    emails: { email: string }[];
    code?: string;
}

const AddWarehouse = ({ 
    isOpen, 
    onClose, 
    onWarehouseAdded, 
    existingWarehouse 
}: AddWarehouseProps) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [emails, setEmails] = useState<EmailEntry[]>([{ email: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Reset form when warehouse prop changes or modal opens/closes
    useEffect(() => {
        if (existingWarehouse) {
            const warehouseWithEmails = existingWarehouse as WarehouseWithEmails;
            
            setCode(warehouseWithEmails.name); // Note: assuming name is used as code
            setName(warehouseWithEmails.name);
            setLocation(warehouseWithEmails.location || '');
            
            // Populate emails if available
            setEmails(
                warehouseWithEmails.emails && warehouseWithEmails.emails.length > 0 
                    ? warehouseWithEmails.emails.map(email => ({ email: email.email }))
                    : [{ email: '' }]
            );
            setIsEditing(true);
        } else {
            // Reset form for new warehouse
            setCode('');
            setName('');
            setLocation('');
            setEmails([{ email: '' }]);
            setIsEditing(false);
        }
    }, [existingWarehouse, isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!code.trim() && !isEditing) {
            newErrors.code = 'Warehouse code is required';
        }
        
        if (!name.trim()) {
            newErrors.name = 'Warehouse name is required';
        }
        
        if (!location.trim()) {
            newErrors.location = 'Location is required';
        }
        
        // Validate emails
        const emailErrors: string[] = [];
        emails.forEach((emailEntry, index) => {
            if (!emailEntry.email.trim()) {
                emailErrors.push(`Email ${index + 1} is required`);
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEntry.email)) {
                emailErrors.push(`Invalid email format for email ${index + 1}`);
            }
        });

        if (emailErrors.length > 0) {
            newErrors.emails = emailErrors.join(', ');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddEmail = () => {
        setEmails([...emails, { email: '' }]);
    };

    const handleRemoveEmail = (indexToRemove: number) => {
        // Prevent removing the last email
        if (emails.length > 1) {
            setEmails(emails.filter((_, index) => index !== indexToRemove));
        }
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = { email: value };
        setEmails(newEmails);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const newErrors: Record<string, string> = {};
        
        if (!name.trim()) {
            newErrors.name = 'Warehouse name is required';
        }
        
        if (code && code.trim().length > 20) {
            newErrors.code = 'Warehouse code must be 20 characters or less';
        }
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            const warehousePayload: WarehousePayload = {
                name: name.trim(),
                location: location?.trim() || undefined,
                emails: emails.map(emailEntry => ({
                    email: emailEntry.email.trim()
                })),
                code: code ? code.trim() : undefined
            };
            
            let data;
            if (isEditing && existingWarehouse?.id) {
                // Update existing warehouse
                data = await updateWarehouse(existingWarehouse.id, warehousePayload);
                alert('Warehouse updated successfully!');
            } else {
                // Create new warehouse
                data = await createWarehouse(warehousePayload);
                console.info('Warehouse added:', data);
                alert('Warehouse added successfully!');
            }
            
            // Reset form
            setName('');
            setLocation('');
            setCode('');
            setEmails([{ email: '' }]);
            
            // Close modal and notify parent
            onClose();
            if (onWarehouseAdded) {
                onWarehouseAdded();
            }
        } catch (error) {
            console.error('Error saving warehouse:', error);
            alert(`Failed to ${isEditing ? 'update' : 'add'} warehouse: ${(error as Error).message}`);
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
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Warehouse' : 'Add Warehouse'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {!isEditing && (
                        <div className="mb-4">
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">Warehouse Code</label>
                            <input 
                                type="text" 
                                id="code" 
                                value={code} 
                                onChange={(e) => setCode(e.target.value)} 
                                className={`
                                    block w-full px-3 py-2 
                                    border border-gray-300 rounded-md 
                                    shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 
                                    text-gray-900 bg-white 
                                    ${errors.code ? 'border-red-500' : ''}
                                `} 
                                placeholder="Enter warehouse code"
                            />
                            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                        </div>
                    )}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Warehouse Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className={`
                                block w-full px-3 py-2 
                                border border-gray-300 rounded-md 
                                shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 
                                text-gray-900 bg-white 
                                ${errors.name ? 'border-red-500' : ''}
                            `} 
                            placeholder="Enter warehouse name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input 
                            type="text" 
                            id="location" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            className={`
                                block w-full px-3 py-2 
                                border border-gray-300 rounded-md 
                                shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 
                                text-gray-900 bg-white 
                                ${errors.location ? 'border-red-500' : ''}
                            `} 
                            placeholder="Enter warehouse location"
                        />
                        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emails</label>
                        {emails.map((emailEntry, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <input 
                                    type="email" 
                                    value={emailEntry.email} 
                                    onChange={(e) => handleEmailChange(index, e.target.value)}
                                    className={`
                                        flex-grow mr-2 block w-full px-3 py-2 
                                        border border-gray-300 rounded-md 
                                        shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 
                                        text-gray-900 bg-white 
                                        ${errors.emails ? 'border-red-500' : ''}
                                    `} 
                                    placeholder={`Enter email ${index + 1}`}
                                />
                                {emails.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveEmail(index)}
                                        className="bg-red-600 text-white rounded-md px-2 py-1 hover:brightness-90 transition-all"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        {errors.emails && <p className="text-red-500 text-sm mt-1">{errors.emails}</p>}
                        <button 
                            type="button"
                            onClick={handleAddEmail}
                            className="bg-indigo-600 text-white rounded-md px-2 py-1 mt-2 hover:brightness-90 transition-all"
                        >
                            Add Another Email
                        </button>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-red-600 text-white rounded-md px-4 py-2 mr-2 hover:brightness-90 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className={`
                                bg-indigo-600 
                                text-white rounded-md px-4 py-2 
                                hover:brightness-90 transition-all 
                                disabled:opacity-50
                            `}
                        >
                            {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Warehouse' : 'Add Warehouse')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWarehouse;
