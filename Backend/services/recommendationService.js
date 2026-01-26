const db = require('../config/database');

class RecommendationService {
  
  /**
   * Calculate popularity score for items
   * Formula: (purchase_count * 3) + (view_count * 1)
   * Purchases are weighted 3x more than views
   */
  async updateItemMetrics() {
    const query = `
      INSERT INTO item_metrics (item_id, view_count, purchase_count, popularity_score, last_updated)
      SELECT 
        i.id as item_id,
        COALESCE(view_counts.view_count, 0) as view_count,
        COALESCE(purchase_counts.purchase_count, 0) as purchase_count,
        (COALESCE(purchase_counts.purchase_count, 0) * 3 + COALESCE(view_counts.view_count, 0)) as popularity_score,
        NOW() as last_updated
      FROM items i
      LEFT JOIN (
        SELECT iv.item_id, COUNT(*) as view_count
        FROM item_views iv
        INNER JOIN users u ON iv.user_id = u.id
        WHERE u.user_type = 10
        GROUP BY iv.item_id
      ) view_counts ON i.id = view_counts.item_id
      LEFT JOIN (
        SELECT oi.item_id, SUM(oi.quantity) as purchase_count
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        INNER JOIN users u ON o.user_id = u.id
        WHERE u.user_type = 10
          AND o.status IN ('approved', 'shipped')
        GROUP BY oi.item_id
      ) purchase_counts ON i.id = purchase_counts.item_id
      ON DUPLICATE KEY UPDATE
        view_count = VALUES(view_count),
        purchase_count = VALUES(purchase_count),
        popularity_score = VALUES(popularity_score),
        last_updated = VALUES(last_updated)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) {
          console.error('❌ Error updating item metrics:', err);
          reject(err);
        } else {
          console.log(`✅ Updated metrics for items`);
          resolve(result);
        }
      });
    });
  }

  /**
   * Track item view for a user
   * Only tracks if user is a customer (user_type = 10)
   */
  async trackItemView(userId, itemId) {
    if (!userId || !itemId) {
      throw new Error('User ID and Item ID are required');
    }

    // Verify user is a customer
    const userCheckQuery = 'SELECT user_type FROM users WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      db.query(userCheckQuery, [userId], (err, results) => {
        if (err) {
          console.error('❌ Error checking user type:', err);
          return reject(err);
        }

        if (!results || results.length === 0) {
          return reject(new Error('User not found'));
        }

        const userType = results[0].user_type;
        
        // Only track views for customers (user_type = 10)
        if (userType !== 10) {
          console.log(`⚠️ Skipping view tracking for non-customer user ${userId} (type: ${userType})`);
          return resolve({ tracked: false, reason: 'Not a customer' });
        }

        // Insert view record
        const insertQuery = 'INSERT INTO item_views (user_id, item_id, viewed_at) VALUES (?, ?, NOW())';
        
        db.query(insertQuery, [userId, itemId], (err, result) => {
          if (err) {
            console.error('❌ Error tracking item view:', err);
            return reject(err);
          }
          
          console.log(`✅ Tracked view: User ${userId} viewed Item ${itemId}`);
          resolve({ tracked: true, viewId: result.insertId });
        });
      });
    });
  }

  /**
   * Get user's category preferences based on views and purchases
   * Returns array of category IDs ranked by user interest
   */
  async getUserCategoryPreferences(userId) {
    const query = `
      SELECT 
        category_id,
        SUM(purchase_weight) as purchase_score,
        SUM(view_weight) as view_score,
        (SUM(purchase_weight) * 3 + SUM(view_weight)) as total_score
      FROM (
        -- Purchases (weighted 3x)
        SELECT 
          i.category_id,
          SUM(oi.quantity) as purchase_weight,
          0 as view_weight
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        INNER JOIN items i ON oi.item_id = i.id
        WHERE o.user_id = ?
          AND o.status IN ('approved', 'shipped', 'pending')
          AND i.category_id IS NOT NULL
        GROUP BY i.category_id
        
        UNION ALL
        
        -- Views (weighted 1x)
        SELECT 
          i.category_id,
          0 as purchase_weight,
          COUNT(*) as view_weight
        FROM item_views iv
        INNER JOIN items i ON iv.item_id = i.id
        WHERE iv.user_id = ?
          AND i.category_id IS NOT NULL
        GROUP BY i.category_id
      ) combined
      WHERE category_id IS NOT NULL
      GROUP BY category_id
      ORDER BY total_score DESC
      LIMIT 5
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [userId, userId], (err, results) => {
        if (err) {
          console.error('❌ Error getting user category preferences:', err);
          return reject(err);
        }
        
        const categoryIds = results.map(row => row.category_id);
        console.log(`✅ User ${userId} preferred categories:`, categoryIds);
        resolve(categoryIds);
      });
    });
  }

  /**
   * Get similar items for a specific item (same category, ranked by popularity)
   * Used on product detail pages
   */
  async getSimilarItems(itemId, limit = 6, branchId = null) {
    let query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.category_id,
        i.branch_id,
        i.main_img,
        i.quantity,
        i.available,
        ip.price_cash,
        COALESCE(im.popularity_score, 0) as popularity_score
      FROM items i
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.date = (
        SELECT MAX(date) FROM item_prices WHERE item_id = i.id
      )
      LEFT JOIN item_metrics im ON i.id = im.item_id
      WHERE i.category_id = (SELECT category_id FROM items WHERE id = ?)
        AND i.id != ?
        AND i.available = 1
        AND i.quantity > 0
    `;

    const params = [itemId, itemId];

    if (branchId) {
      query += ` AND i.branch_id = ?`;
      params.push(branchId);
    }

    query += ` ORDER BY popularity_score DESC, i.id DESC LIMIT ?`;
    params.push(limit);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error('❌ Error getting similar items:', err);
          return reject(err);
        }
        
        console.log(`✅ Found ${results.length} similar items for item ${itemId}${branchId ? ` in branch ${branchId}` : ''}`);
        resolve(this._formatItems(results));
      });
    });
  }

  /**
   * Get personalized recommendations for logged-in users
   * Based on their view and purchase history
   */
  async getPersonalizedRecommendations(userId, limit = 12, branchId = null) {
    // Get user's preferred categories
    const preferredCategories = await this.getUserCategoryPreferences(userId);
    
    if (preferredCategories.length === 0) {
      // User has no history, fall back to popular items
      console.log(`⚠️ User ${userId} has no history, using popular items`);
      return this.getPopularItems(limit, branchId);
    }

    // Get items from preferred categories, excluding already purchased items
    let query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.category_id,
        i.branch_id,
        i.main_img,
        i.quantity,
        i.available,
        ip.price_cash,
        COALESCE(im.popularity_score, 0) as popularity_score,
        CASE 
          WHEN i.category_id = ? THEN 3
          WHEN i.category_id IN (?, ?, ?) THEN 2
          ELSE 1
        END as category_rank
      FROM items i
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.date = (
        SELECT MAX(date) FROM item_prices WHERE item_id = i.id
      )
      LEFT JOIN item_metrics im ON i.id = im.item_id
      WHERE i.category_id IN (?, ?, ?, ?, ?)
        AND i.available = 1
        AND i.quantity > 0
        AND i.id NOT IN (
          SELECT DISTINCT oi.item_id 
          FROM order_items oi
          INNER JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = ? AND o.status IN ('approved', 'shipped')
        )
    `;

    // Pad categories array to 5 elements
    const categories = [...preferredCategories];
    while (categories.length < 5) {
      categories.push(null);
    }

    const params = [
      categories[0], categories[1], categories[2], categories[3],
      categories[0], categories[1], categories[2], categories[3], categories[4],
      userId
    ];

    if (branchId) {
      query += ` AND i.branch_id = ?`;
      params.push(branchId);
    }

    query += ` ORDER BY category_rank DESC, popularity_score DESC, i.id DESC LIMIT ?`;
    params.push(limit);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error('❌ Error getting personalized recommendations:', err);
          return reject(err);
        }
        
        console.log(`✅ Found ${results.length} personalized recommendations for user ${userId}${branchId ? ` in branch ${branchId}` : ''}`);
        resolve(this._formatItems(results));
      });
    });
  }

  /**
   * Get popular items globally (for cold-start users)
   * Ranked by popularity score
   */
  async getPopularItems(limit = 12, branchId = null) {
    let query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.category_id,
        i.branch_id,
        i.main_img,
        i.quantity,
        i.available,
        ip.price_cash,
        COALESCE(im.popularity_score, 0) as popularity_score
      FROM items i
      LEFT JOIN item_prices ip ON i.id = ip.item_id AND ip.date = (
        SELECT MAX(date) FROM item_prices WHERE item_id = i.id
      )
      LEFT JOIN item_metrics im ON i.id = im.item_id
      WHERE i.available = 1
        AND i.quantity > 0
    `;

    const params = [];

    if (branchId) {
      query += ` AND i.branch_id = ?`;
      params.push(branchId);
    }

    query += ` ORDER BY popularity_score DESC, i.id DESC LIMIT ?`;
    params.push(limit);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          console.error('❌ Error getting popular items:', err);
          return reject(err);
        }
        
        console.log(`✅ Found ${results.length} popular items${branchId ? ` in branch ${branchId}` : ''}`);
        resolve(this._formatItems(results));
      });
    });
  }

  /**
   * Format items to match frontend expected format
   */
  _formatItems(items) {
    return items.map(item => {
      let mainImg = item.main_img;
      
      if (mainImg && !mainImg.startsWith('http://') && !mainImg.startsWith('https://')) {
        if (mainImg.startsWith('/')) {
          mainImg = `http://localhost:5000${mainImg}`;
        } else {
          mainImg = `http://localhost:5000/uploads/${mainImg}`;
        }
      }

      return {
        id: item.id.toString(),
        name: item.name,
        price: parseFloat(item.price_cash) || 0,
        img: mainImg || null,
        description: item.description || '',
        quantity: item.quantity || 0,
        category_id: item.category_id || null,
        popularity_score: item.popularity_score || 0
      };
    });
  }
}

module.exports = new RecommendationService();
