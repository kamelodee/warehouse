import React from 'react';
import { marked } from 'marked';

export default function ExcelUploadGuidePage() {
    // This would be server-side code in a real Next.js app
    // For this example, we'll embed the guide content directly
    const guideContent = `
# Excel Product Upload Guide

This guide explains how to use the Excel Product Upload feature to add multiple products at once to the system.

## Template Format

The Excel file should have the following columns:

1. **Code** (required) - A unique identifier for the product
2. **Name** (required) - The product name
3. **Barcode** (required) - Product barcode
4. **Serialized** (optional) - Whether the product is serialized ("Yes" or "No", defaults to "No")

## Step-by-Step Instructions

1. Click the "Excel Upload" button on the Products page
2. Download the template by clicking "Download Template"
3. Fill in the template with your product data
4. Click "Select Excel File" and choose your completed template
5. The system will analyze your file and show you how many products it contains
6. Click "Show Preview" to review your data before uploading
7. Click "Upload Products" to add the products to the system
8. Wait for the upload to complete - you'll see a progress bar during the upload
9. Once complete, you'll see a success message with the number of products created/updated

## Validation Rules

The server will validate your Excel file and ensure:
- Product Code is required and must be unique
- Product Name is required
- Product Barcode is required
- Serialized field should be "Yes" or "No" (or true/false)

## Tips

- You can upload up to 500 products at once
- The maximum file size is 10MB
- Make sure your Excel file has headers that match the template
- You can customize the template as needed, but keep the column names the same
- Use the preview feature to check your data before uploading

## Troubleshooting

If you encounter any issues:

1. Make sure your Excel file has the correct format
2. Ensure all required fields are filled in
3. Try downloading a fresh template and transferring your data
4. Check that your file size is under 10MB
5. Verify that you're using a supported Excel format (.xlsx or .xls)

For additional help, contact your system administrator.
    `;

    // Convert markdown to HTML
    const htmlContent = marked(guideContent);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        </div>
    );
}
