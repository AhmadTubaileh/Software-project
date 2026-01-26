const db = require('./config/database');

console.log('🔍 Diagnosing view count discrepancy...\n');

const itemId = 9; // Change this to the item you're checking

// Check all views for this item
const allViewsQuery = `
  SELECT 
    iv.id,
    iv.user_id,
    u.username,
    u.user_type,
    iv.viewed_at
  FROM item_views iv
  LEFT JOIN users u ON iv.user_id = u.id
  WHERE iv.item_id = ?
  ORDER BY iv.viewed_at DESC
`;

db.query(allViewsQuery, [itemId], (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  console.log(`📊 All views for Item ${itemId}:`);
  console.log('='.repeat(80));
  
  let customerViews = 0;
  let nonCustomerViews = 0;
  let invalidViews = 0;

  results.forEach((row, index) => {
    const userInfo = row.username 
      ? `User ${row.user_id} (${row.username}, type: ${row.user_type})`
      : `User ${row.user_id} (NOT FOUND)`;
    
    console.log(`${index + 1}. ${userInfo} - ${row.viewed_at}`);

    if (!row.username) {
      invalidViews++;
    } else if (row.user_type === 10) {
      customerViews++;
    } else {
      nonCustomerViews++;
    }
  });

  console.log('\n📈 Summary:');
  console.log('='.repeat(80));
  console.log(`Total views in item_views: ${results.length}`);
  console.log(`Customer views (user_type = 10): ${customerViews} ✅ (counted in metrics)`);
  console.log(`Non-customer views (user_type 0-9): ${nonCustomerViews} ⚠️ (NOT counted)`);
  console.log(`Invalid user views: ${invalidViews} ❌ (user deleted/not found)`);

  console.log('\n');

  // Check item_metrics
  const metricsQuery = `SELECT view_count, popularity_score FROM item_metrics WHERE item_id = ?`;
  
  db.query(metricsQuery, [itemId], (err, metricsResults) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }

    if (metricsResults.length > 0) {
      console.log(`📊 Item ${itemId} in item_metrics:`);
      console.log('='.repeat(80));
      console.log(`View count: ${metricsResults[0].view_count}`);
      console.log(`Popularity score: ${metricsResults[0].popularity_score}`);
      
      if (metricsResults[0].view_count === customerViews) {
        console.log('\n✅ Metrics are CORRECT - only counting customer views');
      } else {
        console.log(`\n⚠️ MISMATCH: Expected ${customerViews} but got ${metricsResults[0].view_count}`);
      }
    } else {
      console.log(`⚠️ Item ${itemId} not found in item_metrics table`);
      console.log('Run: curl -X POST http://localhost:5000/api/recommendations/update-metrics');
    }

    process.exit(0);
  });
});
