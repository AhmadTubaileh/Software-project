const API_BASE_URL = 'http://localhost:5000/api';

class RecommendationApi {
  
  async trackItemView(userId, itemId) {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/track-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, itemId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error tracking view:', error);
      throw error;
    }
  }

  async getSimilarItems(itemId, limit = 6, branchId = null) {
    try {
      let url = `${API_BASE_URL}/recommendations/similar/${itemId}?limit=${limit}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching similar items:', error);
      throw error;
    }
  }

  async getPersonalizedRecommendations(userId, limit = 12, branchId = null) {
    try {
      let url = `${API_BASE_URL}/recommendations/personalized?userId=${userId}&limit=${limit}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  }

  async getPopularItems(limit = 12, branchId = null) {
    try {
      let url = `${API_BASE_URL}/recommendations/popular?limit=${limit}`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching popular items:', error);
      throw error;
    }
  }

  async updateMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/update-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating metrics:', error);
      throw error;
    }
  }
}

export default new RecommendationApi();
