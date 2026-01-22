const db = require('./config/database');

console.log('🧪 Testing metrics calculation query...\n');

// Test the exact query used in updateItemMetrics
const testQuery = `
  SELECT 
    i.id as item_id,
    COALESCE(view_counts.view_count, 0) as view_count,
    COALESCE(purchase_counts.purchase_count, 0) as purchase_count,
    (COALESCE(purchase_counts.purchase_count, 0) * 3 + COALESCE(view_counts.view_count, 0)) as popularity_score
  FROM items i
  LEFT JOIN (
    SELECT item_id, COUNT(*) as view_count
    FROM item_views
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 10)
    GROUP BY item_id
  ) view_counts ON i.id = view_counts.item_id
  LEFT JOIN (
    SELECT oi.item_id, SUM(oi.quantity) as purchase_count
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.user_id IN (SELECT id FROM users WHERE user_type = 10)
      AND o.status IN ('approved', 'shipped')
    GROUP BY oi.item_id
  ) purchase_counts ON i.id = purchase_counts.item_id
  WHERE i.id = 9
`;

db.query(testQuery, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  console.log('📊 Query Result for Item 9:');
  console.log('='.repeat(80));
  console.log(results[0]);

  console.log('\n🔍 Checking subquery directly:');
  
  const subqueryTest = `
    SELECT item_id, COUNT(*) as view_count
    FROM item_views
    WHERE user_id IN (SELECT id FROM users WHERE user_type = 10)
      AND item_id = 9
    GROUP BY item_id
  `;

  db.query(subqueryTest, (err, subResults) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }

    console.log('Subquery result:', subResults);

    console.log('\n🔍 Checking without subquery:');
    
    const simpleTest = `
      SELECT 
        iv.item_id,
        COUNT(*) as view_count,
        GROUP_CONCAT(DISTINCT u.user_type) as user_types
      FROM item_views iv
      INNER JOIN users u ON iv.user_id = u.id
      WHERE iv.item_id = 9 AND u.user_type = 10
      GROUP BY iv.item_id
    `;

    db.query(simpleTest, (err, simpleResults) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }

      console.log('Simple query result:', simpleResults);
      
      if (simpleResults.length > 0 && simpleResults[0].view_count === 7) {
        console.log('\n✅ Simple query works correctly - counts all 7 views');
        console.log('⚠️ Problem is with the subquery in updateItemMetrics');
      }

      process.exit(0);
    });
  });
});
