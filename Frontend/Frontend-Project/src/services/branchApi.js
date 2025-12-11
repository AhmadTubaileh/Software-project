const API_BASE_URL = 'http://localhost:5000/api';

class BranchApi {
  // Get all branches
  static async getAllBranches() {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`);
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  // Get branch by ID
  static async getBranchById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/branches/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch branch');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }

  // Create new branch
  static async createBranch(branchData) {
    try {
      console.log('Sending branch data to backend...');
      
      const response = await fetch(`${API_BASE_URL}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create branch');
      }

      const result = await response.json();
      console.log('Create branch success:', result);
      return result;
      
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  // Update branch
  static async updateBranch(id, branchData) {
    try {
      console.log('Updating branch ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to update branch');
      }

      const result = await response.json();
      console.log('Update branch success:', result);
      return result;
      
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  // Delete branch
  static async deleteBranch(id) {
    try {
      console.log('Deleting branch ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE',
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete branch');
      }

      const result = await response.json();
      console.log('Delete branch success:', result);
      return result;
      
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }
}

export default BranchApi;