import React from 'react';
import * as XLSX from 'xlsx';

interface DownloadTemplateProps {
    variant?: 'button' | 'link';
    className?: string;
}

const DownloadTemplate = ({ variant = 'link', className = '' }: DownloadTemplateProps) => {
    const handleDownloadTemplate = () => {
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Sample data with headers
        const data = [
            {
                'Code': 'SAMPLE001',
                'Name': 'Sample Product 1',
                'Barcode': '123456789012',
                'Serialized': 'No'
            },
            {
                'Code': 'SAMPLE002',
                'Name': 'Sample Product 2',
                'Barcode': '234567890123',
                'Serialized': 'Yes'
            }
        ];
        
        // Convert data to worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        
        // Generate Excel file and trigger download
        XLSX.writeFile(wb, 'product_template.xlsx');
    };
    
    if (variant === 'button') {
        return (
            <button
                onClick={handleDownloadTemplate}
                className={`bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 ${className}`}
            >
                Download Template
            </button>
        );
    }
    
    return (
        <button
            onClick={handleDownloadTemplate}
            className={`text-blue-600 hover:text-blue-800 underline text-sm ${className}`}
        >
            Download Template
        </button>
    );
};

export default DownloadTemplate;
