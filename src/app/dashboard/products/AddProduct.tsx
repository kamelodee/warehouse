import React, { useState, useRef } from 'react';
import { createProduct, Product } from '../../api/productService';
import { uploadImage } from '../../api/imageUploadService';

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
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setUploadError('Please select an image file');
                return;
            }
            
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setUploadError('Image size should be less than 5MB');
                return;
            }
            
            setImage(file);
            setUploadError(null);
            
            // Create a preview
            const reader = new FileReader();
            reader.onloadstart = () => {
                setUploadProgress(0);
            };
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    setUploadProgress(Math.round((event.loaded / event.total) * 100));
                }
            };
            reader.onload = () => {
                setImagePreview(reader.result as string);
                setUploadProgress(100);
            };
            reader.onerror = () => {
                setUploadError('Failed to load image preview');
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        setUploadProgress(0);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setUploadError(null);

        try {
            // Validate form data
            if (!code.trim()) {
                throw new Error("Product code is required");
            }
            if (!name.trim()) {
                throw new Error("Product name is required");
            }
            if (!barcode.trim()) {
                throw new Error("Barcode is required");
            }

            // Create product first
            const payload: Product = {
                code: code.trim(),
                name: name.trim(),
                barcode: barcode.trim(),
                serialized
            };

            // Log the payload for debugging
            console.log('Submitting product with payload:', payload);

            // If there's an image, upload it first
            if (image) {
                try {
                    const imageUrl = await uploadImage(image);
                    payload.imageUrl = imageUrl;
                } catch (error) {
                    setUploadError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    setIsLoading(false);
                    return;
                }
            }

            // Now create the product with the image URL if available
            const data = await createProduct(payload);
            console.log('Product added:', data);
            alert('Product added successfully!');
            
            // Reset form fields
            setCode('');
            setName('');
            setBarcode('');
            setSerialized(true);
            clearImage();
            
            // Close modal and notify parent component
            onClose();
            if (onProductAdded) {
                onProductAdded();
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error adding product: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
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
                    
                    {/* Image Upload Section */}
                    <div className="mb-4">
                        <label htmlFor="image" className="block text-gray-700">Product Image</label>
                        <div className="mt-1 flex items-center">
                            <input 
                                type="file" 
                                id="image" 
                                ref={fileInputRef}
                                onChange={handleImageChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md px-4 py-2 mr-2"
                            >
                                Select Image
                            </button>
                            {image && (
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 rounded-md px-4 py-2"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        
                        {uploadError && (
                            <p className="text-red-500 text-sm mt-1">{uploadError}</p>
                        )}
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                        
                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="mt-3 border rounded-md p-2">
                                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                                <div className="relative">
                                    <img 
                                        src={imagePreview} 
                                        alt="Product preview" 
                                        className="max-h-48 max-w-full object-contain"
                                    />
                                </div>
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
                            {isLoading ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProduct;
