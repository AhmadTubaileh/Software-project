const recommendationService = require('./services/recommendationService');

async function testRecommendationSystem() {
  console.log('🧪 Testing Recommendation System...\n');

  try {
    console.log('1️⃣ Updating item metrics...');
    await recommendationService.updateItemMetrics();
    console.log('✅ Metrics updated successfully\n');

    console.log('2️⃣ Testing popular items (cold-start)...');
    const popularItems = await recommendationService.getPopularItems(5);
    console.log(`✅ Found ${popularItems.length} popular items:`);
    popularItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} - $${item.price} (Score: ${item.popularity_score})`);
    });
    console.log('');

    console.log('3️⃣ Testing similar items for item ID 1...');
    const similarItems = await recommendationService.getSimilarItems(1, 5);
    console.log(`✅ Found ${similarItems.length} similar items:`);
    similarItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} - $${item.price}`);
    });
    console.log('');

    console.log('4️⃣ Testing view tracking for user 1, item 1...');
    const trackResult = await recommendationService.trackItemView(1, 1);
    console.log(`✅ View tracking result:`, trackResult);
    console.log('');

    console.log('5️⃣ Testing personalized recommendations for user 1...');
    const personalizedItems = await recommendationService.getPersonalizedRecommendations(1, 5);
    console.log(`✅ Found ${personalizedItems.length} personalized items:`);
    personalizedItems.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} - $${item.price}`);
    });
    console.log('');

    console.log('✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRecommendationSystem();
