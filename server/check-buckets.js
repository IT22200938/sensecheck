import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InteractionBucket from './models/InteractionBucket.js';
import Session from './models/Session.js';

dotenv.config();

/**
 * Check Interaction Buckets Script
 * Displays statistics and sample data from the bucket-based interaction tracking system
 * Demonstrates the relationship between Session and InteractionBucket schemas
 */

const checkBuckets = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all sessions
    const sessions = await Session.find({});
    console.log(`📊 Total Sessions: ${sessions.length}\n`);
    console.log('='.repeat(80));

    // Iterate through sessions
    for (const session of sessions) {
      console.log(`\n🎮 Session: ${session.sessionId}`);
      console.log('-'.repeat(80));
      
      // Display session info
      console.log(`📅 Created: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`👤 User: Age ${session.userInfo?.age}, ${session.userInfo?.gender}`);
      console.log(`💻 Device: ${session.deviceType} (${session.platform || 'Unknown'})`);
      console.log(`✅ Completed Modules: ${session.completedModules?.length || 0}`);
      if (session.completedModules?.length > 0) {
        session.completedModules.forEach(mod => {
          console.log(`   - ${mod.moduleName} (${new Date(mod.completedAt).toLocaleString()})`);
        });
      }

      // Get stats for this session using the session method
      const stats = await session.getInteractionStats();
      
      console.log('\n📈 INTERACTION STATISTICS:');
      console.log(`   Total Interactions: ${stats.total}`);
      console.log(`   Global Interactions: ${stats.global.interactionCount}`);
      console.log(`   Motor Interactions: ${stats.motor.interactionCount}`);
      
      // Global buckets
      if (stats.global.bucketCount > 0) {
        console.log('\n🌐 GLOBAL INTERACTION BUCKETS:');
        console.log(`   Bucket Count: ${stats.global.bucketCount}`);
        stats.global.buckets.forEach(bucket => {
          console.log(`   - Bucket #${bucket.bucketNumber}: ${bucket.count} interactions (${bucket.isFull ? 'FULL' : 'Active'})`);
          console.log(`     Time Range: ${new Date(bucket.timeRange.first).toLocaleString()} - ${new Date(bucket.timeRange.last).toLocaleString()}`);
        });
        
        // Sample interactions using session method
        const globalInteractions = await session.getAllInteractions('global');
        if (globalInteractions.length > 0) {
          console.log('\n   📝 Sample Global Interactions (first 5):');
          globalInteractions.slice(0, 5).forEach((interaction, idx) => {
            console.log(`   ${idx + 1}. ${interaction.eventType} at ${new Date(interaction.timestamp).toLocaleTimeString()}`);
            if (interaction.target) {
              console.log(`      Target: ${JSON.stringify(interaction.target).substring(0, 80)}...`);
            }
          });
        }
      } else {
        console.log('\n🌐 GLOBAL INTERACTION BUCKETS: None');
      }
      
      // Motor buckets
      if (stats.motor.bucketCount > 0) {
        console.log('\n🎯 MOTOR SKILL BUCKETS:');
        console.log(`   Bucket Count: ${stats.motor.bucketCount}`);
        stats.motor.buckets.forEach(bucket => {
          console.log(`   - Bucket #${bucket.bucketNumber}: ${bucket.count} interactions (${bucket.isFull ? 'FULL' : 'Active'})`);
          console.log(`     Time Range: ${new Date(bucket.timeRange.first).toLocaleString()} - ${new Date(bucket.timeRange.last).toLocaleString()}`);
        });
        
        // Sample interactions using session method
        const motorInteractions = await session.getAllInteractions('motor');
        if (motorInteractions.length > 0) {
          console.log('\n   📝 Sample Motor Skill Interactions (first 5):');
          motorInteractions.slice(0, 5).forEach((interaction, idx) => {
            console.log(`   ${idx + 1}. ${interaction.eventType} - Round ${interaction.round || 'N/A'} at ${new Date(interaction.timestamp).toLocaleTimeString()}`);
            if (interaction.bubbleId) {
              console.log(`      Bubble: ${interaction.bubbleId}`);
            }
            if (interaction.reactionTime) {
              console.log(`      Reaction Time: ${interaction.reactionTime}ms`);
            }
          });
        }
      } else {
        console.log('\n🎯 MOTOR SKILL BUCKETS: None');
      }
      
      console.log('\n' + '='.repeat(80));
    }

    // Get bucket statistics
    console.log('\n\n📊 DATABASE BUCKET STATISTICS:');
    console.log('-'.repeat(80));
    
    const totalBuckets = await InteractionBucket.countDocuments();
    const globalBuckets = await InteractionBucket.countDocuments({ interactionType: 'global' });
    const motorBuckets = await InteractionBucket.countDocuments({ interactionType: 'motor' });
    const fullBuckets = await InteractionBucket.countDocuments({ isFull: true });
    const activeBuckets = await InteractionBucket.countDocuments({ isFull: false });
    
    console.log(`Total Buckets: ${totalBuckets}`);
    console.log(`- Global Buckets: ${globalBuckets}`);
    console.log(`- Motor Buckets: ${motorBuckets}`);
    console.log(`- Full Buckets: ${fullBuckets}`);
    console.log(`- Active Buckets: ${activeBuckets}`);
    
    // Calculate total interactions
    const allBuckets = await InteractionBucket.find();
    const totalInteractions = allBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
    const avgInteractionsPerBucket = totalBuckets > 0 ? (totalInteractions / totalBuckets).toFixed(2) : 0;
    
    console.log(`\nTotal Interactions Stored: ${totalInteractions}`);
    console.log(`Average Interactions per Bucket: ${avgInteractionsPerBucket}`);
    
    // Storage efficiency
    if (totalBuckets > 0) {
      console.log(`\n💾 STORAGE EFFICIENCY:`);
      console.log(`- Documents in DB: ${totalBuckets} (bucket pattern)`);
      console.log(`- Would be without bucketing: ${totalInteractions} documents`);
      console.log(`- Document reduction: ${((1 - totalBuckets / totalInteractions) * 100).toFixed(2)}%`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
checkBuckets();

