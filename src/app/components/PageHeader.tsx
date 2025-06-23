import React, { Suspense } from 'react';

interface FilterOption {
    value: string;
    label: string;
}

interface PageHeaderProps {
    title: string;
    showAddButton?: boolean;
    showUploadButton?: boolean;
    showFilters?: boolean;
    onAddClick?: () => void;
    onUploadClick?: () => void;
    isUploading?: boolean;
    size?: number;
    onSizeChange?: (size: number) => void;
    sortField?: string;
    onSortFieldChange?: (field: string) => void;
    sortOptions?: FilterOption[];
    sort?: string;
    onSortChange?: (sort: string) => void;
    onApplyFilters?: () => void;
    isLoading?: boolean;
    page?: number;
    totalPages?: number;
    onPageChange?: (newPage: number) => void;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    showAddButton = true,
    showUploadButton = true,
    showFilters = true,
    onAddClick,
    onUploadClick,
    isUploading = false,
    size,
    onSizeChange,
    sortField,
    onSortFieldChange,
    sortOptions = [],
    sort,
    onSortChange,
    onApplyFilters,
    isLoading = false,
    page = 0,
    totalPages = 1,
    onPageChange,
    children
}) => {
    return (
        <div className="mb-6">
            <h1 className="text-black font-bold mb-4">{title}</h1>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 mb-4">
                {showAddButton && (
                    <button 
                        onClick={onAddClick}
                        className="bg-indigo-600 text-white rounded p-2"
                    >
                        Add {title.replace(' Management', '')}
                    </button>
                )}
                {showUploadButton && (
                    <button 
                        onClick={onUploadClick}
                        className={`${
                            isUploading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-500 hover:bg-green-600'
                        } text-white font-semibold py-2 px-4 rounded-md`}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Upload in Progress...' : 'Upload'}
                    </button>
                )}
            </div>

            {/* Child Components (Modals) */}
            <Suspense fallback={<div>Loading...</div>}>
                {children}
            </Suspense>

            {/* Filters */}
            {showFilters && (
                <div className="flex space-x-4 mb-4">
                    {onSizeChange && (
                        <div>
                            <label htmlFor="size" className="border rounded p-1 text-black">Size:</label>
                            <input
                                type="number"
                                id="size"
                                value={size}
                                onChange={(e) => onSizeChange(Number(e.target.value))}
                                min="1"
                                className="border rounded p-1 text-black"
                            />
                        </div>
                    )}
                    {onSortFieldChange && sortOptions.length > 0 && (
                        <div>
                            <label htmlFor="sortField" className="border rounded p-1 text-black">Sort By:</label>
                            <select
                                id="sortField"
                                value={sortField}
                                onChange={(e) => onSortFieldChange(e.target.value)}
                                className="border rounded p-1 text-black"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {onSortChange && (
                        <div>
                            <label htmlFor="sort" className="border rounded p-1 text-black">Order:</label>
                            <select
                                id="sort"
                                value={sort}
                                onChange={(e) => onSortChange(e.target.value)}
                                className="border rounded p-1 text-black"
                            >
                                <option value="ASC">Ascending</option>
                                <option value="DESC">Descending</option>
                            </select>
                        </div>
                    )}
                    {onApplyFilters && (
                        <button 
                            onClick={onApplyFilters}
                            disabled={isLoading}
                            className="bg-indigo-600 text-white rounded p-1"
                        >
                            {isLoading ? 'Loading...' : 'Apply Filters'}
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {onPageChange && (
                <div className="pagination mb-4 text-black">
                    <button 
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 0 || isLoading}
                        className="bg-gray-300 rounded p-2 mr-2"
                    >
                        Previous
                    </button>
                    <span className="mx-2 text-black">Page {page + 1} of {totalPages}</span>
                    <button 
                        onClick={() => onPageChange(page + 1)}
                        disabled={page + 1 === totalPages || isLoading}
                        className="bg-gray-300 rounded p-2 ml-2"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PageHeader;
