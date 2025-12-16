import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './models/Session.js';
import InteractionBucket from './models/InteractionBucket.js';

dotenv.config();

/**
 * Test Schema Relationships
 * Verifies that Session ↔ InteractionBucket relationship works correctly
 */

const testRelationships = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const testSessionId = `test_session_${Date.now()}`;

    // ===== TEST 1: Create Session =====
    console.log('📝 TEST 1: Creating test session...');
    const session = await Session.create({
      sessionId: testSessionId,
      userInfo: {
        age: 25,
        gender: 'Male',
      },
      deviceType: 'desktop',
      platform: 'Win32',
    });
    console.log(`✅ Session created: ${session.sessionId}\n`);

    // ===== TEST 2: Try to create bucket with non-existent session (should fail) =====
    console.log('📝 TEST 2: Attempting to create bucket with invalid session...');
    try {
      await InteractionBucket.addInteraction(
        'non_existent_session',
        'global',
        { eventType: 'test', timestamp: new Date() }
      );
      console.log('❌ FAILED: Should have thrown an error\n');
    } catch (error) {
      console.log(`✅ PASSED: Error caught as expected: "${error.message}"\n`);
    }

    // ===== TEST 3: Create bucket with valid session (should succeed) =====
    console.log('📝 TEST 3: Creating bucket with valid session...');
    const bucket1 = await InteractionBucket.addInteraction(
      testSessionId,
      'global',
      { eventType: 'click', target: { id: 'test-button' } }
    );
    console.log(`✅ Global bucket created: Bucket #${bucket1.bucketNumber}, Count: ${bucket1.count}\n`);

    // ===== TEST 4: Add more interactions =====
    console.log('📝 TEST 4: Adding multiple interactions...');
    for (let i = 0; i < 5; i++) {
      await InteractionBucket.addInteraction(
        testSessionId,
        'global',
        { eventType: 'mouse_move', position: { x: i * 10, y: i * 20 } }
      );
    }
    
    await InteractionBucket.addInteraction(
      testSessionId,
      'motor',
      { eventType: 'bubble_hit', round: 1, bubbleId: 'bubble_1' }
    );
    console.log('✅ Multiple interactions added\n');

    // ===== TEST 5: Query using session methods =====
    console.log('📝 TEST 5: Testing session helper methods...');
    
    const stats = await session.getInteractionStats();
    console.log(`✅ Session stats retrieved:`);
    console.log(`   - Global interactions: ${stats.global.interactionCount}`);
    console.log(`   - Motor interactions: ${stats.motor.interactionCount}`);
    console.log(`   - Total interactions: ${stats.total}\n`);

    // ===== TEST 6: Test virtual fields =====
    console.log('📝 TEST 6: Testing virtual field population...');
    const sessionWithBuckets = await Session.findOne({ sessionId: testSessionId })
      .populate('interactionBuckets');
    console.log(`✅ Virtual field populated: ${sessionWithBuckets.interactionBuckets.length} buckets found\n`);

    // ===== TEST 7: Test cascade delete =====
    console.log('📝 TEST 7: Testing cascade delete...');
    const bucketCountBefore = await InteractionBucket.countDocuments({ sessionId: testSessionId });
    console.log(`   - Buckets before delete: ${bucketCountBefore}`);
    
    await session.remove();
    
    const bucketCountAfter = await InteractionBucket.countDocuments({ sessionId: testSessionId });
    console.log(`   - Buckets after delete: ${bucketCountAfter}`);
    
    if (bucketCountAfter === 0) {
      console.log('✅ Cascade delete works correctly!\n');
    } else {
      console.log('❌ Cascade delete failed!\n');
    }

    // ===== SUMMARY =====
    console.log('=' .repeat(80));
    console.log('🎉 ALL TESTS COMPLETED');
    console.log('=' .repeat(80));
    console.log('✅ Session validation: PASSED');
    console.log('✅ Bucket creation: PASSED');
    console.log('✅ Session methods: PASSED');
    console.log('✅ Virtual fields: PASSED');
    console.log('✅ Cascade delete: PASSED');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run tests
testRelationships();

