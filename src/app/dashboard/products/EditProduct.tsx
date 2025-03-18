import React, { useState, useEffect, useRef } from 'react';
import { getProduct, updateProduct, Product } from '../../api/productService';
import { uploadImage } from '../../api/imageUploadService';

interface EditProductProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number | null;
    onProductUpdated?: () => void;
}

const EditProduct = ({ isOpen, onClose, productId, onProductUpdated }: EditProductProps) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [serialized, setSerialized] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset form when modal is closed
        if (!isOpen) {
            setCode('');
            setName('');
            setBarcode('');
            setSerialized(true);
            setFetchError(null);
            setImage(null);
            setImagePreview(null);
            setCurrentImageUrl(null);
            setUploadProgress(0);
            setUploadError(null);
            return;
        }

        // Fetch product data when modal is opened and productId is available
        if (productId) {
            fetchProductData(productId);
        }
    }, [isOpen, productId]);

    const fetchProductData = async (id: number) => {
        setIsLoading(true);
        setFetchError(null);

        try {
            const data = await getProduct(id);
            console.log('Product fetched:', data);
            
            // Update form fields with fetched data
            setCode(data.code || '');
            setName(data.name || '');
            setBarcode(data.barcode || '');
            setSerialized(data.serialized || false);
            
            // Set current image URL if available
            if (data.imageUrl) {
                setCurrentImageUrl(data.imageUrl);
            } else {
                setCurrentImageUrl(null);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            setFetchError(`Error fetching product: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

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
            if (!productId) {
                throw new Error('Product ID is missing');
            }
            
            const payload: Product = {
                code,
                name,
                barcode,
                serialized
            };
            
            // If there's a current image URL and no new image, keep the current image
            if (currentImageUrl && !image) {
                payload.imageUrl = currentImageUrl;
            }
            
            // If there's a new image, upload it
            if (image) {
                try {
                    const imageUrl = await uploadImage(image, productId);
                    payload.imageUrl = imageUrl;
                } catch (error) {
                    setUploadError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    setIsLoading(false);
                    return;
                }
            }
            
            const data = await updateProduct(productId, payload);
            console.log('Product updated:', data);
            alert('Product updated successfully!');
            
            // Close modal and notify parent component
            onClose();
            if (onProductUpdated) {
                onProductUpdated();
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert(`Error updating product: ${(error as Error).message}`);
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
                    <h2 className="text-2xl font-bold">Edit Product</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                
                {fetchError && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {fetchError}
                    </div>
                )}
                
                {isLoading && !fetchError ? (
                    <div className="flex justify-center items-center h-40">
                        <p>Loading product data...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="code" className="block text-gray-700">Product Code</label>
                            <input 
                                type="text" 
                                id="code" 
                                value={code} 
                                onChange={(e) => setCode(e.target.value)} 
                                required 
                                className="mt-1 block w-full border rounded-md p-2" 
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700">Product Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                className="mt-1 block w-full border rounded-md p-2" 
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="barcode" className="block text-gray-700">Barcode</label>
                            <input 
                                type="text" 
                                id="barcode" 
                                value={barcode} 
                                onChange={(e) => setBarcode(e.target.value)} 
                                required 
                                className="mt-1 block w-full border rounded-md p-2" 
                            />
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={serialized} 
                                    onChange={(e) => setSerialized(e.target.checked)} 
                                    className="mr-2" 
                                />
                                Serialized
                            </label>
                        </div>
                        
                        {/* Image Upload Section */}
                        <div className="mb-4">
                            <label htmlFor="image" className="block text-gray-700">Product Image</label>
                            
                            {/* Current Image Preview */}
                            {currentImageUrl && !imagePreview && (
                                <div className="mt-2 mb-3 border rounded-md p-2">
                                    <p className="text-sm text-gray-500 mb-1">Current Image:</p>
                                    <div className="relative">
                                        <img 
                                            src={currentImageUrl} 
                                            alt="Current product" 
                                            className="max-h-48 max-w-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                            
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
                                    {currentImageUrl ? 'Change Image' : 'Select Image'}
                                </button>
                                {(image || currentImageUrl) && (
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
                            
                            {/* New Image Preview */}
                            {imagePreview && (
                                <div className="mt-3 border rounded-md p-2">
                                    <p className="text-sm text-gray-500 mb-1">New Image Preview:</p>
                                    <div className="relative">
                                        <img 
                                            src={imagePreview} 
                                            alt="New product preview" 
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
                                {isLoading ? 'Updating...' : 'Update Product'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditProduct;
