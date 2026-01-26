const db = require('./config/database');

console.log('🔍 Checking view tracking data...\n');

// Check item_views table
const viewsQuery = `
  SELECT 
    item_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT user_id) as unique_users
  FROM item_views
  GROUP BY item_id
  ORDER BY total_views DESC
`;

db.query(viewsQuery, (err, viewsResults) => {
  if (err) {
    console.error('❌ Error querying item_views:', err);
    process.exit(1);
  }

  console.log('📊 ITEM_VIEWS TABLE (Raw tracking data):');
  console.log('=========================================');
  if (viewsResults.length === 0) {
    console.log('⚠️ No views found in item_views table');
  } else {
    viewsResults.forEach(row => {
      console.log(`Item ${row.item_id}: ${row.total_views} views from ${row.unique_users} users`);
    });
  }

  console.log('\n');

  // Check item_metrics table
  const metricsQuery = `
    SELECT 
      item_id,
      view_count,
      purchase_count,
      popularity_score,
      last_updated
    FROM item_metrics
    ORDER BY popularity_score DESC
  `;

  db.query(metricsQuery, (err, metricsResults) => {
    if (err) {
      console.error('❌ Error querying item_metrics:', err);
      process.exit(1);
    }

    console.log('📊 ITEM_METRICS TABLE (Aggregated scores):');
    console.log('=========================================');
    if (metricsResults.length === 0) {
      console.log('⚠️ No metrics found in item_metrics table');
      console.log('💡 Run: curl -X POST http://localhost:5000/api/recommendations/update-metrics');
    } else {
      metricsResults.forEach(row => {
        console.log(`Item ${row.item_id}: ${row.view_count} views, ${row.purchase_count} purchases, Score: ${row.popularity_score}, Updated: ${row.last_updated}`);
      });
    }

    console.log('\n✅ Check complete');
    process.exit(0);
  });
});
