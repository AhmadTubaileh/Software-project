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

  // Create new employee
  static async createEmployee(employeeData) {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      formData.append('username', employeeData.username);
      formData.append('email', employeeData.email);
      formData.append('phone', employeeData.phone);
      formData.append('password', employeeData.password);
      formData.append('user_type', employeeData.userType.toString());
      
      // Append image if exists
      if (employeeData.cardImage && employeeData.cardImage instanceof File) {
        formData.append('card_image', employeeData.cardImage);
      } else if (employeeData.cardImage && typeof employeeData.cardImage === 'string') {
        // If it's a base64 string from editing, convert back to blob
        const response = await fetch(employeeData.cardImage);
        const blob = await response.blob();
        formData.append('card_image', blob);
      }

      console.log('Sending employee data to backend:', {
        username: employeeData.username,
        email: employeeData.email,
        phone: employeeData.phone,
        user_type: employeeData.userType,
        hasPassword: !!employeeData.password,
        hasImage: !!employeeData.cardImage
      });

      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  static async updateEmployee(id, employeeData) {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      formData.append('username', employeeData.username);
      formData.append('email', employeeData.email);
      formData.append('phone', employeeData.phone);
      formData.append('user_type', employeeData.userType.toString());
      
      // Append password only if provided (for updates)
      if (employeeData.password) {
        formData.append('password', employeeData.password);
      }
      
      // Append image if exists and is a new file
      if (employeeData.cardImage && employeeData.cardImage instanceof File) {
        formData.append('card_image', employeeData.cardImage);
      }

      console.log('Updating employee data to backend:', {
        id: id,
        username: employeeData.username,
        email: employeeData.email,
        phone: employeeData.phone,
        user_type: employeeData.userType,
        hasPassword: !!employeeData.password,
        hasImage: !!employeeData.cardImage
      });

      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }

      return await response.json();
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