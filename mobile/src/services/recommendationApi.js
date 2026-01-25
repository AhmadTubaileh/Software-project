const API_BASE = 'http://localhost:5000/api/recommendations';

class RecommendationApi {
  static async getPersonalizedRecommendations(userId, limit = 12, branchId = null) {
    try {
      let url = `${API_BASE}/personalized?userId=${userId}&limit=${limit}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }
      
      return data.items || [];
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  }

  static async getPopularItems(limit = 12, branchId = null) {
    try {
      let url = `${API_BASE}/popular?limit=${limit}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch popular items');
      }
      
      return data.items || [];
    } catch (error) {
      console.error('Error fetching popular items:', error);
      throw error;
    }
  }
}

export default RecommendationApi;
