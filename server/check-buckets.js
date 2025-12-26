import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './models/Session.js';
import GlobalInteractionBucket from './models/GlobalInteractionBucket.js';
import MotorPointerTraceBucket from './models/MotorPointerTraceBucket.js';
import MotorAttemptBucket from './models/MotorAttemptBucket.js';
import { MotorRoundSummary, MotorSessionSummary } from './models/MotorSummary.js';

dotenv.config();

/**
 * Check ML-Ready Buckets Script
 * Displays statistics from the new ML-ready motor skills tracking system
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

    // Get overall statistics
    console.log('📊 OVERALL STATISTICS');
    console.log('='.repeat(80));
    
    const sessionCount = await Session.countDocuments();
    const globalBucketCount = await GlobalInteractionBucket.countDocuments();
    const pointerBucketCount = await MotorPointerTraceBucket.countDocuments();
    const attemptBucketCount = await MotorAttemptBucket.countDocuments();
    const roundSummaryCount = await MotorRoundSummary.countDocuments();
    const sessionSummaryCount = await MotorSessionSummary.countDocuments();
    
    console.log(`📁 Sessions: ${sessionCount}`);
    console.log(`🌐 Global Interaction Buckets: ${globalBucketCount}`);
    console.log(`📍 Motor Pointer Trace Buckets: ${pointerBucketCount}`);
    console.log(`🎯 Motor Attempt Buckets: ${attemptBucketCount}`);
    console.log(`📊 Motor Round Summaries: ${roundSummaryCount}`);
    console.log(`📈 Motor Session Summaries: ${sessionSummaryCount}`);
    console.log('');

    // Get all sessions
    const sessions = await Session.find({}).sort({ createdAt: -1 }).limit(5);
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found in database');
      return;
    }
    
    console.log(`\n📋 RECENT SESSIONS (Last ${sessions.length})`);
    console.log('='.repeat(80));

    // Iterate through sessions
    for (const session of sessions) {
      console.log(`\n🎮 Session: ${session.sessionId}`);
      console.log('-'.repeat(80));
      
      // Display session info
      console.log(`📅 Created: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`👤 User: Age ${session.userInfo?.age || 'N/A'}, ${session.userInfo?.gender || 'N/A'}`);
      console.log(`💻 Device: ${session.deviceType || 'Unknown'}`);
      console.log(`✅ Completed Modules: ${session.completedModules?.length || 0}`);
      if (session.completedModules?.length > 0) {
        session.completedModules.forEach(mod => {
          console.log(`   - ${mod.moduleName} (${new Date(mod.completedAt).toLocaleString()})`);
        });
      }

      // Global Interactions
      const globalBuckets = await GlobalInteractionBucket.find({ sessionId: session.sessionId });
      let totalGlobalInteractions = 0;
      globalBuckets.forEach(bucket => {
        totalGlobalInteractions += bucket.count;
      });
      
      console.log('\n🌐 GLOBAL INTERACTIONS:');
      console.log(`   Buckets: ${globalBuckets.length}`);
      console.log(`   Total Interactions: ${totalGlobalInteractions}`);
      
      if (globalBuckets.length > 0) {
        const sampleBucket = globalBuckets[0];
        console.log(`   Sample Bucket #${sampleBucket.bucketNumber}: ${sampleBucket.count} interactions`);
        if (sampleBucket.interactions.length > 0) {
          console.log(`   Sample Events (first 3):`);
          sampleBucket.interactions.slice(0, 3).forEach((interaction, idx) => {
            console.log(`      ${idx + 1}. ${interaction.eventType} (module: ${interaction.module})`);
          });
        }
      }
      
      // Motor Pointer Traces
      const pointerBuckets = await MotorPointerTraceBucket.find({ sessionId: session.sessionId });
      let totalPointerSamples = 0;
      pointerBuckets.forEach(bucket => {
        totalPointerSamples += bucket.count;
      });
      
      console.log('\n📍 MOTOR POINTER TRACES:');
      console.log(`   Buckets: ${pointerBuckets.length}`);
      console.log(`   Total Samples: ${totalPointerSamples}`);
      
      if (pointerBuckets.length > 0) {
        const rounds = { 1: 0, 2: 0, 3: 0 };
        pointerBuckets.forEach(bucket => {
          bucket.samples.forEach(sample => {
            if (rounds[sample.round] !== undefined) {
              rounds[sample.round]++;
            }
          });
        });
        console.log(`   By Round: R1=${rounds[1]}, R2=${rounds[2]}, R3=${rounds[3]}`);
      }
      
      // Motor Attempts
      const attemptBuckets = await MotorAttemptBucket.find({ sessionId: session.sessionId });
      let totalAttempts = 0;
      attemptBuckets.forEach(bucket => {
        totalAttempts += bucket.count;
      });
      
      console.log('\n🎯 MOTOR ATTEMPTS:');
      console.log(`   Buckets: ${attemptBuckets.length}`);
      console.log(`   Total Attempts: ${totalAttempts}`);
      
      if (attemptBuckets.length > 0) {
        const rounds = { 1: 0, 2: 0, 3: 0 };
        let hits = 0;
        attemptBuckets.forEach(bucket => {
          bucket.attempts.forEach(attempt => {
            if (rounds[attempt.round] !== undefined) {
              rounds[attempt.round]++;
            }
            if (attempt.click.hit) hits++;
          });
        });
        console.log(`   By Round: R1=${rounds[1]}, R2=${rounds[2]}, R3=${rounds[3]}`);
        console.log(`   Hit Rate: ${totalAttempts > 0 ? ((hits / totalAttempts) * 100).toFixed(1) : 0}% (${hits}/${totalAttempts})`);
        
        // Show sample attempt
        if (attemptBuckets[0].attempts.length > 0) {
          const sample = attemptBuckets[0].attempts[0];
          console.log(`   Sample Attempt:`);
          console.log(`      Round: ${sample.round}, Hit: ${sample.click.hit}`);
          console.log(`      Target: (${sample.target.x.toFixed(3)}, ${sample.target.y.toFixed(3)}, r=${sample.target.radius.toFixed(3)})`);
          if (sample.timing?.reactionTimeMs) {
            console.log(`      Reaction Time: ${sample.timing.reactionTimeMs}ms`);
          }
        }
      }
      
      // Round Summaries
      const roundSummaries = await MotorRoundSummary.find({ sessionId: session.sessionId }).sort({ round: 1 });
      
      console.log('\n📊 ROUND SUMMARIES:');
      console.log(`   Count: ${roundSummaries.length}`);
      
      if (roundSummaries.length > 0) {
        roundSummaries.forEach(summary => {
          console.log(`   Round ${summary.round}:`);
          console.log(`      Targets: ${summary.counts?.nTargets || 0}`);
          console.log(`      Hits: ${summary.counts?.nHits || 0}`);
          console.log(`      Misses: ${summary.counts?.nMisses || 0}`);
          console.log(`      Hit Rate: ${summary.counts?.hitRate ? (summary.counts.hitRate * 100).toFixed(1) : 0}%`);
          
          // Show some feature samples
          if (summary.features) {
            const featureKeys = Object.keys(summary.features);
            if (featureKeys.length > 0) {
              console.log(`      Features: ${featureKeys.slice(0, 5).join(', ')}... (${featureKeys.length} total)`);
            }
          }
        });
      }
      
      // Session Summary
      const sessionSummary = await MotorSessionSummary.findOne({ sessionId: session.sessionId });
      
      console.log('\n📈 SESSION SUMMARY:');
      if (sessionSummary) {
        console.log(`   Participant ID: ${sessionSummary.participantId}`);
        console.log(`   Feature Version: ${sessionSummary.featureVersion}`);
        console.log(`   Label: ${sessionSummary.label?.level || 'unknown'} (source: ${sessionSummary.label?.source || 'none'})`);
        
        if (sessionSummary.features) {
          const featureKeys = Object.keys(sessionSummary.features);
          console.log(`   Total Features: ${featureKeys.length}`);
          
          // Show sample features
          if (featureKeys.length > 0) {
            console.log(`   Sample Features:`);
            featureKeys.slice(0, 5).forEach(key => {
              const value = sessionSummary.features[key];
              if (typeof value === 'number') {
                console.log(`      ${key}: ${value.toFixed(3)}`);
              } else {
                console.log(`      ${key}: ${value}`);
              }
            });
          }
        }
      } else {
        console.log(`   No session summary found`);
      }
      
      console.log('');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run check
checkBuckets();
