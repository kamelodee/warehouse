'use client';
import { useState, useEffect } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  warehouse?: {
    id: number;
    name: string;
  } | null;
}

interface Warehouse {
  id: number;
  name: string;
}

interface ApiResponse {
  status: string;
  timestamp: string;
  message: string;
  debugMessage: string | null;
  subErrors: any | null;
}

interface PaginatedResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  content: User[];
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    { id: 223, name: 'Main Warehouse' },
    { id: 224, name: 'Secondary Warehouse' },
  ]);

  const [token, setToken] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersFetchError, setUsersFetchError] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
    size: 10,
    number: 0,
    numberOfElements: 0,
    first: true,
    last: false
  });
  
  // Only include fields required for the API payload
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '', // Not sent to API but needed for validation
    warehouseId: 223
  });

  useEffect(() => {
    const storedToken = sessionStorage.getItem('accessToken');
    setToken(storedToken);
    
    // Fetch users when component mounts
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 0) => {
    setIsLoadingUsers(true);
    setUsersFetchError(null);
    
    try {
      const storedToken = sessionStorage.getItem('accessToken');
      
      // Prepare payload for pagination
      const payload = {
        totalPages: 0,
        totalElements: 0,
        size: 10,
        number: page,
        numberOfElements: 0,
        first: page === 0,
        last: false
      };
      
      const response = await fetch('http://stock.hisense.com.gh/api/v1.0/users/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': storedToken ? `Bearer ${storedToken}` : ''
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }
      
      const data: PaginatedResponse = await response.json();
      
      // Update users and pagination state
      setUsers(data.content);
      setPagination({
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size,
        number: data.number,
        numberOfElements: data.numberOfElements,
        first: data.first,
        last: data.last
      });
      
      console.log('Users fetched successfully:', data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersFetchError('Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  const validateForm = () => {
    if (!newUser.firstName) return 'First name is required';
    if (!newUser.lastName) return 'Last name is required';
    if (!newUser.email) return 'Email is required';
    if (!newUser.phoneNumber) return 'Phone number is required';
    if (!newUser.password) return 'Password is required';
    if (newUser.password !== newUser.confirmPassword) return 'Passwords do not match';
    if (newUser.password.length < 8) return 'Password must be at least 8 characters';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) return 'Invalid email format';
    
    // Basic phone number validation for Ghana
    const phoneRegex = /^0[2-5][0-9]{8}$/;
    if (!phoneRegex.test(newUser.phoneNumber)) return 'Invalid phone number format';
    
    return null;
  };

  const handleAddUser = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setApiError(validationError);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Prepare payload with only the required fields for the API
      const payload = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        password: newUser.password,
        warehouseId: newUser.warehouseId
      };

      console.log('Sending payload:', payload);

      // Make API call
      const response = await fetch('http://stock.hisense.com.gh/api/v1.0/users/warehouse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      });

      const data: ApiResponse = await response.json();
      
      if (response.ok) {
        // Success - close modal and refresh user list
        setShowAddModal(false);
        resetForm();
        
        // Show success message
        alert('User created successfully!');
        
        // Refresh the user list
        fetchUsers(pagination.number);
      } else {
        // Handle API error
        console.error('API Error:', data);
        setApiError(data.message || 'Failed to create user. Please try again.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      warehouseId: 223
    });
    setApiError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage user access and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

      {usersFetchError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{usersFetchError}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => fetchUsers()}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Retry</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {isLoadingUsers ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-lg font-medium text-indigo-700">
                                  {user.firstName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-base font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.role || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.warehouse?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pagination.number * pagination.size + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((pagination.number + 1) * pagination.size, pagination.totalElements)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.totalElements}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.number - 1)}
                        disabled={pagination.first}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.first ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageToShow;
                        if (pagination.totalPages <= 5) {
                          pageToShow = i;
                        } else {
                          const startPage = Math.max(0, pagination.number - 2);
                          const endPage = Math.min(pagination.totalPages - 1, pagination.number + 2);
                          
                          if (endPage - startPage < 4) {
                            if (startPage === 0) {
                              pageToShow = i;
                            } else {
                              pageToShow = pagination.totalPages - 5 + i;
                            }
                          } else {
                            pageToShow = startPage + i;
                          }
                        }
                        
                        return (
                          <button
                            key={pageToShow}
                            onClick={() => handlePageChange(pageToShow)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.number === pageToShow
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageToShow + 1}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.number + 1)}
                        disabled={pagination.last}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          pagination.last ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name*
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name*
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="0248000000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse*
                </label>
                <select
                  value={newUser.warehouseId}
                  onChange={(e) => setNewUser({ ...newUser, warehouseId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  required
                >
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password*
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="********"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password*
                </label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="********"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
