import React, { useState, useEffect } from 'react';
import { MdFilterAlt, MdClear } from 'react-icons/md';
import { getWarehouses } from '@/app/api/inventoryService';

interface InventoryFiltersProps {
  onFilterChange?: (filters: any) => void;
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({ onFilterChange }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [warehouses, setWarehouses] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Fetch warehouses from API
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const warehousesData = await getWarehouses();
        setWarehouses(warehousesData);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWarehouses();
  }, []);
  
  // Apply filters automatically when they change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter,
        warehouse: warehouseFilter,
        search: searchQuery
      });
    }
  }, [statusFilter, warehouseFilter, searchQuery, onFilterChange]);
  
  const handleClearFilters = () => {
    setStatusFilter('');
    setWarehouseFilter('');
    setSearchQuery('');
  };
  
  return (
    <div className="inventory-filters">
      <div className="filters-header">
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <MdFilterAlt className="icon" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {(statusFilter || warehouseFilter || searchQuery) && (
          <button 
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            <MdClear className="icon" />
            Clear Filters
          </button>
        )}
      </div>
      
      {(statusFilter || warehouseFilter || searchQuery) && (
        <div className="active-filters">
          <div className="active-filters-label">Active Filters:</div>
          <div className="filters-chips">
            {statusFilter && (
              <div className="filter-chip">
                <span>Status: {statusFilter}</span>
                <button 
                  className="chip-delete" 
                  onClick={() => setStatusFilter('')}
                >
                  ×
                </button>
              </div>
            )}
            {warehouseFilter && (
              <div className="filter-chip">
                <span>Warehouse: {warehouses.find(w => w.id === warehouseFilter)?.name || warehouseFilter}</span>
                <button 
                  className="chip-delete" 
                  onClick={() => setWarehouseFilter('')}
                >
                  ×
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="filter-chip">
                <span>Search: {searchQuery}</span>
                <button 
                  className="chip-delete" 
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {showFilters && (
        <div className="filters-grid">
          <div className="filter-item">
            <div className="form-control">
              <label htmlFor="search-input">Search Serial Number</label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter serial number"
              />
            </div>
          </div>
          
          <div className="filter-item">
            <div className="form-control">
              <label htmlFor="status-select">Status</label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
          </div>
          
          <div className="filter-item">
            <div className="form-control">
              <label htmlFor="warehouse-select">Warehouse</label>
              <select
                id="warehouse-select"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                disabled={loading}
              >
                <option value="">All</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <div className="form-helper-text">Filter by location</div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .inventory-filters {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .filters-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .filter-toggle-button, .clear-filters-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .filter-toggle-button:hover, .clear-filters-button:hover {
          background-color: #f5f5f5;
        }
        
        .clear-filters-button {
          color: #d32f2f;
          border-color: #d32f2f;
        }
        
        .icon {
          margin-right: 0.5rem;
        }
        
        .active-filters {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .active-filters-label {
          font-weight: bold;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .filters-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .filter-chip {
          display: flex;
          align-items: center;
          background-color: #e3f2fd;
          border-radius: 16px;
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .chip-delete {
          margin-left: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          padding: 0;
          color: #666;
        }
        
        .chip-delete:hover {
          color: #d32f2f;
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        @media (min-width: 640px) {
          .filters-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .filter-item {
          width: 100%;
        }
        
        .form-control {
          display: flex;
          flex-direction: column;
        }
        
        .form-control label {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .form-control input, .form-control select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .form-control input:focus, .form-control select:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        
        .form-helper-text {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default InventoryFilters;