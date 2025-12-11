const API_BASE_URL = 'http://localhost:5000/api';

class EmployeeApi {
  // Get all employees
  static async getAllEmployees() {
    try {
      console.log('Fetching all employees...');
      const response = await fetch(`${API_BASE_URL}/employees`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch employees. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Employees fetched successfully:', data.length, 'employees');
      return data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee by ID
  static async getEmployeeById(id) {
    try {
      console.log(`Fetching employee ${id}...`);
      const response = await fetch(`${API_BASE_URL}/employees/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employee. Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Get all branches
  static async getAllBranches() {
    try {
      console.log('Fetching all branches...');
      const response = await fetch(`${API_BASE_URL}/employees/branches/all`);
      
      if (!response.ok) {
        console.log(`Branches endpoint returned: ${response.status}`);
        
        // Try test endpoint to see if API is working
        const testResponse = await fetch(`${API_BASE_URL}/employees/test`);
        if (testResponse.ok) {
          console.log('API is working, but branches endpoint might not exist');
        } else {
          console.log('API endpoint might be wrong');
        }
        
        // For development, return mock data
        console.log('Returning mock branch data for development');
        return [
          { id: 1, name: 'Main Branch' },
          { id: 2, name: 'North Branch' },
          { id: 3, name: 'South Branch' },
          { id: 4, name: 'East Branch' },
          { id: 5, name: 'West Branch' }
        ];
      }
      
      const data = await response.json();
      console.log('Branches fetched successfully:', data.length, 'branches');
      return data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      
      // Return mock data for development
      console.log('Using mock branch data due to error');
      return [
        { id: 1, name: 'Main Branch (Mock)' },
        { id: 2, name: 'North Branch (Mock)' },
        { id: 3, name: 'South Branch (Mock)' }
      ];
    }
  }

  // Get accessible branches for current user
  static async getAccessibleBranches(currentUserId) {
    try {
      console.log(`Fetching accessible branches for user ${currentUserId}...`);
      const response = await fetch(`${API_BASE_URL}/employees/branches/accessible?userId=${currentUserId}`);
      
      if (!response.ok) {
        console.log(`Accessible branches endpoint failed: ${response.status}`);
        console.log('Falling back to all branches');
        return await this.getAllBranches();
      }
      
      const data = await response.json();
      console.log('Accessible branches fetched:', data.length, 'branches');
      return data;
    } catch (error) {
      console.error('Error fetching accessible branches:', error);
      console.log('Falling back to all branches due to error');
      return await this.getAllBranches();
    }
  }

  // Create new employee
  static async createEmployee(formData, currentUserId) {
    try {
      console.log('Creating new employee...');
      
      // Add currentUserId to formData for branch validation
      formData.append('currentUserId', currentUserId);

      // Log form data for debugging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'card_image') {
          console.log(`${key}:`, value);
        } else {
          console.log(`${key}:`, value ? 'Image file present' : 'No image');
        }
      }

      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Failed to create employee');
        } catch {
          throw new Error(errorText || `Failed to create employee. Status: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Create employee success:', result);
      return result;
      
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  static async updateEmployee(id, formData, currentUserId) {
    try {
      console.log(`Updating employee ${id}...`);
      
      // Add currentUserId to formData
      formData.append('currentUserId', currentUserId);

      // Log form data for debugging
      console.log('Update FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'card_image') {
          console.log(`${key}:`, value);
        } else {
          console.log(`${key}:`, value ? 'Image file present' : 'No image');
        }
      }

      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        body: formData,
      });

      console.log('Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Failed to update employee');
        } catch {
          throw new Error(errorText || `Failed to update employee. Status: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Update employee success:', result);
      return result;
      
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  static async deleteEmployee(id) {
    try {
      console.log(`Deleting employee ${id}...`);
      
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Failed to delete employee');
        } catch {
          throw new Error(errorText || `Failed to delete employee. Status: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Delete employee success:', result);
      return result;
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Test API connection
  static async testApi() {
    try {
      console.log('Testing API connection...');
      const response = await fetch(`${API_BASE_URL}/employees/test`);
      
      if (!response.ok) {
        throw new Error(`API test failed. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API test success:', data);
      return data;
    } catch (error) {
      console.error('API test error:', error);
      throw error;
    }
  }

  // Test branches endpoint specifically
  static async testBranchesEndpoint() {
    try {
      console.log('Testing branches endpoint...');
      const response = await fetch(`${API_BASE_URL}/employees/branches/all`);
      
      if (!response.ok) {
        throw new Error(`Branches endpoint failed. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Branches endpoint test success:', data);
      return data;
    } catch (error) {
      console.error('Branches endpoint test error:', error);
      throw error;
    }
  }
}

export default EmployeeApi;