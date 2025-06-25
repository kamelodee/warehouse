'use client';
import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  warehouse?: {
    id: number;
    code: string;
    name: string;
    location: string;
  } | null;
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  emails: {
    id: number;
    email: string;
  }[];
}

interface ApiResponse {
  status: string;
  timestamp: string;
  message: string;
  debugMessage: string | null;
  subErrors: Record<string, unknown> | null;
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [token, setToken] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEditUser, setIsLoadingEditUser] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editApiError, setEditApiError] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersFetchError, setUsersFetchError] = useState<string | null>(null);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [warehousesFetchError, setWarehousesFetchError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<number | null>(null);

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
  const [newUser, setNewUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    warehouseId: number;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'USER', // Default role
    warehouseId: 0
  });

  // Edit user state
  const [editUser, setEditUser] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    warehouseId: number;
  }>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    warehouseId: 0
  });

  // Utility function to format API errors
  const formatApiError = (data: ApiResponse): string => {
    console.log('Formatting API error:', data);

    let errorMessage = data.message || 'An error occurred';

    // Add debug message if available
    if (data.debugMessage) {
      console.log('Debug message:', data.debugMessage);
      // Only include debug message in development
      if (process.env.NODE_ENV === 'development') {
        errorMessage += `\nDebug: ${data.debugMessage}`;
      }
    }

    // Add sub-errors if available
    if (data.subErrors && Array.isArray(data.subErrors) && data.subErrors.length > 0) {
      console.log('Sub-errors:', data.subErrors);

      const subErrorMessages = data.subErrors.map(err => {
        if (err.field && err.message) {
          return `${err.field}: ${err.message}`;
        } else if (err.message) {
          return err.message;
        } else {
          return 'Unknown error';
        }
      });

      if (subErrorMessages.length > 0) {
        errorMessage += '\n' + subErrorMessages.join('\n');
      }
    }

    return errorMessage;
  };

  // Define fetchUsers and fetchWarehouses functions before using them in useEffect
  const fetchUsers = useCallback(async (page = 0, size = pagination.size) => {
    console.log(`Starting user fetching process for page ${page}, size ${size}`);
    setIsLoadingUsers(true);
    setUsersFetchError(null);

    try {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.warn('No access token found for user API request');
      }

      // Prepare payload for pagination
      const payload = {
        totalPages: 0,
        totalElements: 0,
        size: size,
        number: page,
        numberOfElements: 0,
        first: page === 0,
        last: false
      };

      console.log('Sending user search payload:', payload);

      const response = await fetch('https://stock.hisense.com.gh/api/v1.0/users/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': storedToken ? `Bearer ${storedToken}` : ''
        },
        body: JSON.stringify(payload)
      });

      console.log('User search API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('Error fetching users:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        // Try to parse the error response as JSON
        let errorData: ApiResponse | null = null;
        try {
          errorData = JSON.parse(errorText) as ApiResponse;
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }

        if (errorData) {
          setUsersFetchError(formatApiError(errorData));
        } else {
          setUsersFetchError(`Error fetching users: ${response.status} ${response.statusText}`);
        }

        throw new Error(`Error fetching users: ${response.status} ${response.statusText}`);
      }

      const data: PaginatedResponse = await response.json();

      console.log('User search response data structure:', {
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size,
        number: data.number,
        contentLength: data.content?.length || 0
      });

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

      console.log(`Successfully fetched ${data.content.length} users (page ${data.number + 1} of ${data.totalPages})`);
    } catch (error) {
      console.error('Exception during user fetching:', error);
      setUsersFetchError('Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
      console.log('User fetching process completed');
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    setIsLoadingWarehouses(true);
    setWarehousesFetchError(null);

    try {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.warn('No access token found for warehouse API request');
      }

      // Prepare payload for warehouse search
      const payload = {
        totalPages: 0,
        totalElements: 0,
        size: 100, // Get a large number of warehouses
        number: 0,
        numberOfElements: 0,
        first: true,
        last: false
      };

      console.log('Sending warehouse search payload:', payload);

      const response = await fetch('https://stock.hisense.com.gh/api/v1.0/warehouses/search?page=0&size=100&sort=ASC&sortField=id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': storedToken ? `Bearer ${storedToken}` : ''
        },
        body: JSON.stringify(payload)
      });

      console.log('Warehouse API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('Error fetching warehouses:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        // Try to parse the error response as JSON
        let errorData: ApiResponse | null = null;
        try {
          errorData = JSON.parse(errorText) as ApiResponse;
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }

        // Log formatted error message
        if (errorData) {
          const formattedError = formatApiError(errorData);
          console.error('Formatted warehouse API error:', formattedError);
          setWarehousesFetchError(formattedError);
        } else {
          setWarehousesFetchError(`Error fetching warehouses: ${response.status} ${response.statusText}`);
        }

        throw new Error(`Error fetching warehouses: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Warehouse response data structure:', {
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size,
        contentLength: data.content?.length || 0
      });

      // Update warehouses state
      if (data.content && Array.isArray(data.content)) {
        console.log(`Successfully fetched ${data.content.length} warehouses`);
        setWarehouses(data.content);

        // If warehouses are loaded and there's at least one, set the default warehouse ID
        if (data.content.length > 0) {
          console.log('Setting default warehouse ID:', data.content[0].id);
          setNewUser(prev => ({
            ...prev,
            warehouseId: data.content[0].id
          }));
        } else {
          console.warn('No warehouses returned from API');
        }
      } else {
        console.error('Invalid warehouse data format:', data);
        throw new Error('Invalid warehouse data format: content is not an array');
      }
    } catch (error) {
      console.error('Exception during warehouse fetching:', error);

      // Set error message
      if (error instanceof Error) {
        setWarehousesFetchError(error.message);
      } else {
        setWarehousesFetchError('An unexpected error occurred while fetching warehouses');
      }

      // Fallback to default warehouses if API fails
      console.log('Using fallback warehouse data');
      const fallbackWarehouses = [
        { 
          id: 1, 
          code: "DCWH", 
          name: "Dansoman WH", 
          location: "Dansoman", 
          emails: [] 
        },
        { 
          id: 2, 
          code: "FISHW", 
          name: "Fishing Harbour Warehouse", 
          location: "Tema", 
          emails: [
            { 
              id: 1, 
              email: "user@email.com" 
            }
          ] 
        }
      ];

      setWarehouses(fallbackWarehouses);

      // Set default warehouse ID from fallback data
      if (fallbackWarehouses.length > 0) {
        setNewUser(prev => ({
          ...prev,
          warehouseId: fallbackWarehouses[0].id
        }));
      }
    } finally {
      setIsLoadingWarehouses(false);
      console.log('Warehouse fetching process completed');
    }
  }, []);

  // Function to handle page change
  // Load data when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUsers();
      fetchWarehouses();
    }
  }, [fetchUsers, fetchWarehouses]);

  const handlePageChange = (pageNum: number) => {
    console.log(`Changing to page ${pageNum}`);
    if (pageNum < 0 || pageNum >= pagination.totalPages) {
      console.warn(`Invalid page number: ${pageNum}`);
      return;
    }

    fetchUsers(pageNum);
  };

  // Function to handle user deletion
  const handleDeleteUser = async (userId: number) => {
    console.log(`Starting user deletion process for user ID: ${userId}`);
    setIsDeleting(userId);
    setDeleteError(null);

    try {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.warn('No access token found for user deletion API request');
        throw new Error('Authentication token is missing');
      }

      console.log(`Sending DELETE request to: https://stock.hisense.com.gh/api/v1.0/users/${userId}`);

      const response = await fetch(`https://stock.hisense.com.gh/api/v1.0/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        }
      });

      console.log('User deletion API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('Error deleting user:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        // Try to parse the error response as JSON
        let errorData: ApiResponse | null = null;
        try {
          errorData = JSON.parse(errorText) as ApiResponse;
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }

        if (errorData) {
          throw new Error(formatApiError(errorData));
        } else {
          throw new Error(`Error deleting user: ${response.status} ${response.statusText}`);
        }
      }

      // Check if response has content
      let data: ApiResponse | null = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('User deletion response data:', data);
      } else {
        console.log('User deletion successful (no content in response)');
      }

      // Success - refresh user list
      console.log(`User with ID ${userId} deleted successfully`);
      setShowDeleteConfirmModal(false);
      setUserToDelete(null);

      // Show success message
      alert('User deleted successfully!');

      // Refresh the user list
      fetchUsers(pagination.number);
    } catch (error) {
      console.error('Exception during user deletion:', error);

      // Set error message
      if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError('An unexpected error occurred while deleting the user');
      }
    } finally {
      setIsDeleting(null);
      console.log('User deletion process completed');
    }
  };

  // Function to open delete confirmation modal
  const openDeleteConfirmModal = (user: User) => {
    console.log('Opening delete confirmation modal for user:', user);
    setUserToDelete(user);
    setShowDeleteConfirmModal(true);
    setDeleteError(null);
  };

  // Function to fetch a single user for editing
  const fetchUserForEdit = async (userId: number) => {
    console.log(`Starting user fetch for editing, user ID: ${userId}`);
    setIsLoadingEditUser(true);
    setEditApiError(null);

    try {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.warn('No access token found for user fetch API request');
        throw new Error('Authentication token is missing');
      }

      console.log(`Sending GET request to: https://stock.hisense.com.gh/api/v1.0/users/${userId}`);

      const response = await fetch(`https://stock.hisense.com.gh/api/v1.0/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        }
      });

      console.log('User fetch API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('Error fetching user for edit:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        // Try to parse the error response as JSON
        let errorData: ApiResponse | null = null;
        try {
          errorData = JSON.parse(errorText) as ApiResponse;
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
        }

        if (errorData) {
          throw new Error(formatApiError(errorData));
        } else {
          throw new Error(`Error fetching user: ${response.status} ${response.statusText}`);
        }
      }

      const userData = await response.json();
      console.log('User data fetched successfully:', userData);

      // Log the complete user data structure to help with debugging
      console.log('Complete user data structure:', JSON.stringify(userData, null, 2));

      // Populate edit form with user data
      setEditUser({
        id: userData.id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        role: userData.role || '',
        warehouseId: userData.warehouse?.id || 0
      });

      // Open edit modal
      setShowEditModal(true);
    } catch (error) {
      console.error('Exception during user fetch for edit:', error);

      // Set error message
      if (error instanceof Error) {
        setEditApiError(error.message);
      } else {
        setEditApiError('An unexpected error occurred while fetching the user');
      }
    } finally {
      setIsLoadingEditUser(false);
      console.log('User fetch for edit process completed');
    }
  };

  // Function to handle user update
  const handleUpdateUser = async () => {
    console.log('Starting user update process');

    // Validate form
    const validationError = validateEditForm();
    if (validationError) {
      console.error('Form validation failed:', validationError);
      setEditApiError(validationError);
      return;
    }

    setIsLoadingEditUser(true);
    setEditApiError(null);

    try {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        console.warn('No access token found for user update API request');
        throw new Error('Authentication token is missing');
      }

      // Prepare payload with only the required fields for the API
      const payload: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        role: string;
        warehouseId: number;
      } = {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        phoneNumber: editUser.phoneNumber,
        role: editUser.role,
        warehouseId: editUser.warehouseId
      };
      
      // Make API call to update the user
      const response = await fetch(`https://stock.hisense.com.gh/api/v1.0/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify(payload)
      });

      console.log('User update API response status:', response.status, response.statusText);

      const data: ApiResponse = await response.json();

      if (response.ok) {
        console.log('User updated successfully:', {
          status: data.status,
          message: data.message
        });

        // Success - close modal and refresh user list
        setShowEditModal(false);
        resetEditForm();

        // Show success message
        alert('User updated successfully!');

        // Refresh the user list
        fetchUsers(pagination.number);
      } else {
        // Handle API error
        console.error('API Error during user update:', {
          status: response.status,
          statusText: response.statusText,
          apiResponse: data
        });

        // Use the utility function to format the error message
        setEditApiError(formatApiError(data));
      }
    } catch (error) {
      // Log the full error details
      console.error('Exception during user update:', error);

      // Provide a user-friendly error message
      setEditApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoadingEditUser(false);
      console.log('User update process completed');
    }
  };

  // Function to validate edit form
  const validateEditForm = () => {
    // Remove password validation
    if (!editUser.firstName) return 'First Name is required';
    if (!editUser.lastName) return 'Last Name is required';
    if (!editUser.email) return 'Email is required';
    if (!editUser.phoneNumber) return 'Phone Number is required';
    if (!editUser.role) return 'Role is required';

    // Optional password validation removed
    return null;
  };

  // Function to reset edit form
  const resetEditForm = () => {
    setEditUser({
      id: 0,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: '',
      warehouseId: 0
    });
    setEditApiError(null);
  };





  // Function to open edit form
  const openEditForm = (userId: number) => {
    console.log('Opening edit form for user ID:', userId);
    setUserToEdit(userId);
    fetchUserForEdit(userId);
  };

  // Function to validate form
  const validateForm = () => {
    if (!newUser.firstName) return 'First Name is required';
    if (!newUser.lastName) return 'Last Name is required';
    if (!newUser.email) return 'Email is required';
    if (!newUser.phoneNumber) return 'Phone Number is required';
    if (!newUser.role) return 'Role is required';
    if (!newUser.warehouseId) return 'Warehouse is required';
    return null;
  };

  // Function to reset form
  const resetForm = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'USER',
      warehouseId: warehouses.length > 0 ? warehouses[0].id : 0
    });
    setApiError(null);
  };


  const handleAddUser = async () => {
    console.log('Starting user creation process');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      console.error('Form validation failed:', validationError);
      setIsLoading(false);
      setApiError(validationError);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Prepare payload with only the required fields for the API
      const payload: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        role: string;
        warehouseId: number;
      } = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        warehouseId: newUser.warehouseId
      };

      console.log('Sending user creation payload:', {
        ...payload,
        warehouseDetails: warehouses.find(w => w.id === payload.warehouseId)
      });

      // Make API call to the specified endpoint for user creation
      const response = await fetch('https://stock.hisense.com.gh/api/v1.0/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify(payload)
      });

      const data: ApiResponse = await response.json();
      console.log('User creation API response status:', response.status, response.statusText);

      if (response.ok) {
        console.log('User created successfully:', {
          status: data.status,
          message: data.message
        });

        // Success - close modal and refresh user list
        setShowAddModal(false);
        resetForm();

        // Show success message
        alert('User created successfully!');

        // Refresh the user list
        fetchUsers(pagination.number);
      } else {
        // Handle API error
        console.error('API Error during user creation:', {
          status: response.status,
          statusText: response.statusText,
          apiResponse: data
        });

        // Use the utility function to format the error message
        setApiError(formatApiError(data));
      }
    } catch (error) {
      // Log the full error details
      console.error('Exception during user creation:', error);

      // Provide a user-friendly error message
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('User creation process completed');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-black font-bold mb-4">Users Management</h1>
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Add User
        </button>
        <button 
          onClick={() => fetchUsers(pagination.number)}
          className={`${isLoadingUsers 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-2 px-4 rounded-md`}
          disabled={isLoadingUsers}
        >
          {isLoadingUsers ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {usersFetchError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-sm text-red-700">{usersFetchError}</p>
        </div>
      )}

      {warehousesFetchError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-sm text-red-700">{warehousesFetchError}</p>
        </div>
      )}

      <div className="  rounded-lg overflow-hidden">
        {/* Table controls */}
        <div className="flex space-x-4 mb-4">
          <div>
            <label htmlFor="size" className="border rounded p-1 text-black">Size:</label>
            <input
              type="number"
              id="size"
              value={pagination.size}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setPagination(prev => ({ ...prev, size: newSize }));
                fetchUsers(0, newSize);
              }}
              min="1"
              className="border rounded p-1 text-black"
            />
          </div>
          
        </div>
         {/* Pagination */}
         <div className="pagination mb-4 text-black">
              <button 
                onClick={() => handlePageChange(pagination.number - 1)} 
                disabled={pagination.first || isLoadingUsers} 
                className="bg-gray-300 rounded p-2 mr-2"
              >
                Previous
              </button>
              <span className="mx-2 text-black">Page {pagination.number + 1} of {pagination.totalPages}</span>
              <button 
                onClick={() => handlePageChange(pagination.number + 1)} 
                disabled={pagination.last || isLoadingUsers} 
                className="bg-gray-300 rounded p-2 ml-2"
              >
                Next
              </button>
            </div>
        
        {isLoadingUsers ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : usersFetchError ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">{usersFetchError}</div>
            <button 
              onClick={() => fetchUsers(pagination.number)} 
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phoneNumber || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.warehouse?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => openEditForm(user.id)} 
                          className="text-blue-500 hover:text-blue-700 mr-4"
                          disabled={isLoadingEditUser && userToEdit === user.id}
                        >
                          {isLoadingEditUser && userToEdit === user.id ? 'Loading...' : 'Edit'}
                        </button>
                        <button 
                          onClick={() => openDeleteConfirmModal(user)} 
                          className={`${isDeleting === user.id ? 'text-gray-400' : 'text-red-500 hover:text-red-700'}`}
                          disabled={isDeleting === user.id}
                        >
                          {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {usersFetchError ? `Error loading users: ${usersFetchError}` : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
           
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {deleteError}
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                  disabled={isDeleting !== null}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting !== null ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
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
            
            {apiError !== null && apiError !== undefined && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                {apiError.split('\n').map((error, index) => (
                  <p key={index} className="text-sm text-red-600 mb-1">
                    {error}
                  </p>
                ))}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                  placeholder="0248000000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role*
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="WAREHOUSE_USER">Warehouse User</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse*
                </label>
                {isLoadingWarehouses ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-gray-500">Loading warehouses...</span>
                  </div>
                ) : warehouses.length > 0 ? (
                  <select
                    value={newUser.warehouseId}
                    onChange={(e) => setNewUser({ ...newUser, warehouseId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                    required
                  >
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code}) - {warehouse.location}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      No warehouses available
                    </div>
                    <button 
                      type="button"
                      onClick={fetchWarehouses}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Retry loading warehouses
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading || warehouses.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </span>
                ) : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {editApiError !== null && editApiError !== undefined && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                {editApiError.split('\n').map((error, index) => (
                  <p key={index} className="text-sm text-red-600 mb-1">
                    {error}
                  </p>
                ))}
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
                    value={editUser.firstName}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                    value={editUser.lastName}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
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
                  value={editUser.phoneNumber}
                  onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                  placeholder="0248000000"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                >
                  <option value="">Select Role</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse*
                </label>
                {isLoadingWarehouses ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-gray-500">Loading warehouses...</span>
                  </div>
                ) : warehouses.length > 0 ? (
                  <select
                    value={editUser.warehouseId}
                    onChange={(e) => setEditUser({ ...editUser, warehouseId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900"
                    required
                  >
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code}) - {warehouse.location}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      No warehouses available
                    </div>
                    <button 
                      type="button"
                      onClick={fetchWarehouses}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Retry loading warehouses
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading || warehouses.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </span>
                ) : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
