const API_BASE_URL = 'http://localhost:5000/api';

class EmployeeApi {
  // Get all employees
  static async getAllEmployees() {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee by ID
  static async getEmployeeById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Create new employee - UPDATED FOR NEW FORM
  static async createEmployee(formData) {
    try {
      console.log('Sending employee data to backend...');
      
      // DEBUG: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        body: formData, // Use the FormData directly
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(errorText || 'Failed to create employee');
      }

      const result = await response.json();
      console.log('Create employee success:', result);
      return result;
      
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee - UPDATED FOR NEW FORM
  static async updateEmployee(id, formData) {
    try {
      console.log('Updating employee ID:', id);
      
      // DEBUG: Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        body: formData, // Use the FormData directly
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(errorText || 'Failed to update employee');
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
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }
}

export default EmployeeApi;