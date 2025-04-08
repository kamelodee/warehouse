import React, { useState, useEffect, useCallback } from 'react';
import { MdFilterAlt, MdClear, MdSearch, MdCalendarToday } from 'react-icons/md';
import { getWarehouses } from '@/app/api/inventoryService';

interface InventoryFiltersProps {
  onFilterChange?: (filters: any) => void;
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({ onFilterChange }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [warehouses, setWarehouses] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Debounced search handler
  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange({
          status: statusFilter,
          warehouseId: warehouseFilter,
          search: value,
          startDate,
          endDate
        });
      }
    }, 500); // 500ms debounce delay

    setSearchTimeout(timeout);
  }, [statusFilter, warehouseFilter, startDate, endDate, onFilterChange]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Apply non-search filters immediately when they change
  useEffect(() => {
    if (onFilterChange && searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    if (onFilterChange) {
      onFilterChange({
        status: statusFilter,
        warehouseId: warehouseFilter,
        search: searchQuery,
        startDate,
        endDate
      });
    }
  }, [statusFilter, warehouseFilter, startDate, endDate, onFilterChange]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setWarehouseFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="inventory-filters_">
      <div className="filters-header_">
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <MdFilterAlt className="icon" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {(statusFilter || warehouseFilter || searchQuery || startDate || endDate) && (
          <button 
            className="clear-filters-button"
            onClick={handleClearFilters}
          >
            <MdClear className="icon" />
            Clear Filters
          </button>
        )}
      </div>

      {(statusFilter || warehouseFilter || searchQuery || startDate || endDate) && (
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
                  onClick={() => {
                    setSearchQuery('');
                    debouncedSearch('');
                  }}
                >
                  ×
                </button>
              </div>
            )}
            {(startDate || endDate) && (
              <div className="filter-chip">
                <span>Date Range: {startDate} to {endDate}</span>
                <button 
                  className="chip-delete" 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
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
              <label htmlFor="search-input">
                <MdSearch className="icon" />
                Search
              </label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Serial number, product, warehouse..."
                className="search-input"
              />
              <div className="form-helper-text">Search by serial number, product name, etc.</div>
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

          <div className="filter-item date-range">
            <div className="form-control">
              <label htmlFor="start-date">
                <MdCalendarToday className="icon" />
                Date Range
              </label>
              <div className="date-inputs">
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <span className="date-separator">to</span>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                  min={startDate}
                />
              </div>
              <div className="form-helper-text">Filter by creation date</div>
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
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
          transition: all 0.2s ease;
        }

        .filter-toggle-button:hover, .clear-filters-button:hover {
          background-color: #f5f5f5;
          transform: translateY(-1px);
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
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: white;
          border-radius: 4px;
        }

        .active-filters-label {
          font-weight: 500;
          margin-right: 0.5rem;
        }

        .filters-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .filter-chip {
          display: flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background-color: #e3f2fd;
          border-radius: 16px;
          font-size: 0.75rem;
        }

        .chip-delete {
          margin-left: 0.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .chip-delete:hover {
          background-color: rgba(0,0,0,0.1);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .filter-item {
          margin-bottom: 0.5rem;
        }

        .date-range {
          grid-column: span 2;
        }

        .form-control {
          display: flex;
          flex-direction: column;
        }

        .form-control label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .form-helper-text {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }

        input, select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }

        .search-input {
          padding-left: 2rem;
          background-position: 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1rem;
        }

        .date-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-separator {
          font-size: 0.875rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }

          .date-range {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryFilters;