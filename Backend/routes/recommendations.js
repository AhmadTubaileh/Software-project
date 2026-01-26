const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');

// POST /api/recommendations/track-view - Track item view
router.post('/track-view', async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    console.log(`📊 Track view request received: User ${userId}, Item ${itemId}`);

    if (!userId || !itemId) {
      console.log('❌ Missing userId or itemId');
      return res.status(400).json({
        success: false,
        message: 'User ID and Item ID are required'
      });
    }

    const result = await recommendationService.trackItemView(userId, itemId);
    
    console.log(`📊 Track view result:`, result);
    
    res.json({
      success: true,
      tracked: result.tracked,
      message: result.tracked ? 'View tracked successfully' : result.reason
    });
  } catch (error) {
    console.error('❌ Error tracking view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
      error: error.message
    });
  }
});

// GET /api/recommendations/similar/:itemId - Get similar items for product page
router.get('/similar/:itemId', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const limit = parseInt(req.query.limit) || 6;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;

    if (!itemId || isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Item ID is required'
      });
    }

    const items = await recommendationService.getSimilarItems(itemId, limit, branchId);
    
    res.json({
      success: true,
      items: items,
      count: items.length
    });
  } catch (error) {
    console.error('❌ Error getting similar items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar items',
      error: error.message
    });
  }
});

// GET /api/recommendations/personalized - Get personalized recommendations
router.get('/personalized', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const limit = parseInt(req.query.limit) || 12;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid User ID is required'
      });
    }

    const items = await recommendationService.getPersonalizedRecommendations(userId, limit, branchId);
    
    res.json({
      success: true,
      items: items,
      count: items.length,
      type: 'personalized'
    });
  } catch (error) {
    console.error('❌ Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalized recommendations',
      error: error.message
    });
  }
});

// GET /api/recommendations/popular - Get popular items (cold-start)
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;

    const items = await recommendationService.getPopularItems(limit, branchId);
    
    res.json({
      success: true,
      items: items,
      count: items.length,
      type: 'popular'
    });
  } catch (error) {
    console.error('❌ Error getting popular items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular items',
      error: error.message
    });
  }
});

// POST /api/recommendations/update-metrics - Manually trigger metrics update
router.post('/update-metrics', async (req, res) => {
  try {
    await recommendationService.updateItemMetrics();
    
    res.json({
      success: true,
      message: 'Item metrics updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update metrics',
      error: error.message
    });
  }
});

module.exports = router;
