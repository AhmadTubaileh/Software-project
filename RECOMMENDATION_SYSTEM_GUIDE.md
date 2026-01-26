# Product Recommendation System - Implementation Guide

## Overview
A behavior-based product recommendation system for your e-commerce platform that provides personalized suggestions based on user interactions (views and purchases).

## System Architecture

### Backend Components

#### 1. Recommendation Service
**Location**: `Backend/services/recommendationService.js`

**Key Features**:
- Popularity scoring algorithm: `(purchases × 3) + (views × 1)`
- Category affinity calculation
- Customer-only tracking (user_type = 10)
- Three recommendation strategies

**Main Methods**:
- `updateItemMetrics()` - Updates popularity scores in database
- `trackItemView(userId, itemId)` - Records item views
- `getUserCategoryPreferences(userId)` - Gets user's preferred categories
- `getSimilarItems(itemId, limit)` - Items in same category by popularity
- `getPersonalizedRecommendations(userId, limit)` - User-specific recommendations
- `getPopularItems(limit)` - Global popular items (cold-start)

#### 2. API Endpoints
**Location**: `Backend/routes/recommendations.js`

**Endpoints**:
- `POST /api/recommendations/track-view` - Track item view
- `GET /api/recommendations/similar/:itemId` - Get similar items
- `GET /api/recommendations/personalized?userId=X` - Get personalized recommendations
- `GET /api/recommendations/popular` - Get popular items
- `POST /api/recommendations/update-metrics` - Manually update metrics

### Frontend Components

#### 1. View Tracking Hook
**Location**: `Frontend/Frontend-Project/src/hooks/useItemViewTracking.js`

Automatically tracks when logged-in customers view products. Debounced to avoid duplicate tracking.

#### 2. Recommendation API Service
**Location**: `Frontend/Frontend-Project/src/services/recommendationApi.js`

Client-side service for calling recommendation endpoints.

#### 3. Items Component (Updated)
**Location**: `Frontend/Frontend-Project/src/components/store/Items.jsx`

**Behavior**:
- **Logged-in users**: Shows personalized recommendations with "🎯 Recommended For You" header
- **Anonymous users**: Shows popular items with "🔥 Popular Items" header

#### 4. RelatedItems Component
**Location**: `Frontend/Frontend-Project/src/components/store/RelatedItems.jsx`

Displays similar products on product detail pages based on category and popularity.

#### 5. StoreProduct Page (Updated)
**Location**: `Frontend/Frontend-Project/src/pages/StoreProduct.jsx`

- Automatically tracks views when users open product pages
- Shows related items section at bottom

## Three Recommendation Scenarios

### Scenario 1: Item Page Recommendations (Similar Items)
**Trigger**: User views a product detail page

**Logic**:
1. Find items in the same category
2. Exclude the current item
3. Filter available items (quantity > 0)
4. Rank by popularity score
5. Return top 6 items

**Display**: "🔍 Similar Products" section on product page

### Scenario 2: Anonymous/New User (Cold Start)
**Trigger**: User not logged in OR no interaction history

**Logic**:
1. Query all available items
2. Rank by global popularity score
3. Return top 12 items

**Display**: "🔥 Popular Items" header on store home

### Scenario 3: Logged-in User with History (Personalized)
**Trigger**: Logged-in customer with views/purchases

**Logic**:
1. Calculate user's category preferences (purchases weighted 3x, views 1x)
2. Get top 5 preferred categories
3. Find items from those categories
4. Exclude already purchased items
5. Rank by category preference + popularity
6. Return top 12 items

**Display**: "🎯 Recommended For You" header on store home

## Database Schema

### item_metrics Table (Created)
```sql
CREATE TABLE item_metrics (
  item_id INT PRIMARY KEY,
  view_count INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  popularity_score DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### item_views Table (Existing)
Tracks user → item interactions for recommendations.

**Rules**:
- Only inserts if user is a customer (user_type = 10)
- Used for interest scoring

## Priority of User Signals

1. **Purchases** (strongest signal) - Weight: 3x
2. **Repeated views** - Counted in view_count
3. **Single views** - Counted in view_count
4. **Category similarity** - For related items
5. **Global popularity** (fallback) - For cold-start

## Setup Instructions

### 1. Database Setup
The `item_metrics` table should already be created. If not:
```sql
CREATE TABLE item_metrics (
  item_id INT PRIMARY KEY,
  view_count INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  popularity_score DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### 2. Initial Metrics Population
Run this once to populate initial metrics:
```bash
curl -X POST http://localhost:5000/api/recommendations/update-metrics
```

Or call from frontend:
```javascript
import RecommendationApi from './services/recommendationApi';
await RecommendationApi.updateMetrics();
```

### 3. Scheduled Metrics Updates (Optional)
For production, schedule daily metrics updates using cron or similar:
```javascript
// Add to server.js
const recommendationService = require('./services/recommendationService');

setInterval(async () => {
  await recommendationService.updateItemMetrics();
}, 24 * 60 * 60 * 1000); // Every 24 hours
```

## Testing the System

### Test Scenario 1: Anonymous User
1. Open browser in incognito mode
2. Navigate to store home
3. Should see "🔥 Popular Items" header
4. Items ranked by global popularity

### Test Scenario 2: New Logged-in User
1. Create new customer account
2. Login
3. Navigate to store home
4. Should see "🎯 Recommended For You" (will fall back to popular items)
5. Click on several products to build history

### Test Scenario 3: User with History
1. Login as existing customer
2. View multiple products in specific categories
3. Navigate back to store home
4. Should see personalized recommendations from viewed categories
5. Make a purchase
6. Update metrics: `POST /api/recommendations/update-metrics`
7. Refresh store home - purchased items should be excluded

### Test Scenario 4: Related Items
1. Navigate to any product detail page
2. Scroll to bottom
3. Should see "🔍 Similar Products" section
4. Items should be from same category
5. Ranked by popularity

## API Testing with curl

### Track a view:
```bash
curl -X POST http://localhost:5000/api/recommendations/track-view \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "itemId": 5}'
```

### Get similar items:
```bash
curl http://localhost:5000/api/recommendations/similar/5?limit=6
```

### Get personalized recommendations:
```bash
curl http://localhost:5000/api/recommendations/personalized?userId=1&limit=12
```

### Get popular items:
```bash
curl http://localhost:5000/api/recommendations/popular?limit=12
```

## Important Notes

### Customer-Only Tracking
- Only users with `user_type = 10` (customers) have their views tracked
- Employees and admins do not affect recommendations
- This ensures recommendations reflect actual customer behavior

### Machine Learning as Ranking
- ML is used for **ranking**, not filtering
- All items are eligible for recommendations
- Popularity score determines order
- Category preferences determine selection

### Performance Considerations
- `item_metrics` table provides pre-computed scores
- Avoids expensive aggregations on every request
- Update metrics periodically (daily recommended)
- Indexes on `category_id` and `available` improve query speed

### Edge Cases Handled
- Users with no history → Popular items
- Categories with no items → Falls back to other categories
- Out of stock items → Automatically excluded
- Already purchased items → Excluded from personalized recommendations

## Troubleshooting

### No recommendations showing
1. Check if `item_metrics` table has data
2. Run metrics update endpoint
3. Verify items have `available = 1` and `quantity > 0`

### Views not being tracked
1. Check user is logged in
2. Verify user has `user_type = 10`
3. Check browser console for errors
4. Verify backend endpoint is accessible

### Same items for all users
1. Metrics may not be updated
2. Run `POST /api/recommendations/update-metrics`
3. Ensure users have different interaction histories

## Future Enhancements

1. **Collaborative Filtering**: "Users who bought X also bought Y"
2. **Time Decay**: Weight recent interactions higher
3. **A/B Testing**: Test different recommendation algorithms
4. **Click-through Tracking**: Track which recommendations users click
5. **Conversion Tracking**: Measure recommendation effectiveness
6. **Real-time Updates**: Update metrics on each interaction
7. **Category Diversity**: Ensure recommendations span multiple categories
8. **Price-based Filtering**: Recommend items in similar price range

## Files Modified/Created

### Backend
- ✅ `Backend/services/recommendationService.js` (NEW)
- ✅ `Backend/routes/recommendations.js` (NEW)
- ✅ `Backend/server.js` (MODIFIED - added route)

### Frontend
- ✅ `Frontend/Frontend-Project/src/hooks/useItemViewTracking.js` (NEW)
- ✅ `Frontend/Frontend-Project/src/services/recommendationApi.js` (NEW)
- ✅ `Frontend/Frontend-Project/src/components/store/Items.jsx` (MODIFIED)
- ✅ `Frontend/Frontend-Project/src/components/store/RelatedItems.jsx` (NEW)
- ✅ `Frontend/Frontend-Project/src/pages/StoreProduct.jsx` (MODIFIED)

### Database
- ✅ `item_metrics` table (CREATED)

## Success Metrics

Track these to measure system effectiveness:
- Click-through rate on recommendations
- Conversion rate from recommended items
- Average order value with recommendations
- User engagement time on site
- Percentage of purchases from recommendations
