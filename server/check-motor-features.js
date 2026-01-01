/**
 * Check Motor Attempt Features
 * Verifies that kinematics and Fitts law metrics are being computed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from './models/Session.js';
import MotorAttemptBucket from './models/MotorAttemptBucket.js';
import MotorPointerTraceBucket from './models/MotorPointerTraceBucket.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sensecheck';

async function checkMotorFeatures() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get most recent session
    const session = await Session.findOne().sort({ createdAt: -1 });
    
    if (!session) {
      console.log('❌ No sessions found in database');
      return;
    }

    console.log('=' .repeat(80));
    console.log(`📊 SESSION: ${session.sessionId}`);
    console.log('=' .repeat(80));
    console.log(`📅 Created: ${session.createdAt.toLocaleString()}`);
    console.log(`👤 User: Age ${session.userInfo?.age || 'N/A'}, ${session.userInfo?.gender || 'N/A'}`);
    console.log(`💻 Device: ${session.device?.type || 'N/A'}`);
    console.log(`✅ Completed Modules: ${session.completedModules?.length || 0}`);
    if (session.completedModules?.length > 0) {
      session.completedModules.forEach(mod => {
        console.log(`   - ${mod.module} (${new Date(mod.completedAt).toLocaleString()})`);
      });
    }
    console.log('');

    // Check pointer samples
    const pointerBuckets = await MotorPointerTraceBucket.find({ sessionId: session.sessionId });
    const totalSamples = pointerBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
    
    console.log('📍 MOTOR POINTER TRACES:');
    console.log(`   Buckets: ${pointerBuckets.length}`);
    console.log(`   Total Samples: ${totalSamples}`);
    
    if (pointerBuckets.length > 0) {
      const sampleBucket = pointerBuckets[0];
      const samplesByRound = {};
      sampleBucket.samples.forEach(s => {
        samplesByRound[s.round] = (samplesByRound[s.round] || 0) + 1;
      });
      console.log(`   Samples by Round:`, samplesByRound);
    }
    console.log('');

    // Check attempts and their features
    const attemptBuckets = await MotorAttemptBucket.find({ sessionId: session.sessionId });
    const totalAttempts = attemptBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
    
    console.log('🎯 MOTOR ATTEMPTS:');
    console.log(`   Buckets: ${attemptBuckets.length}`);
    console.log(`   Total Attempts: ${totalAttempts}`);
    console.log('');

    if (attemptBuckets.length > 0 && totalAttempts > 0) {
      // Analyze all attempts
      const allAttempts = [];
      attemptBuckets.forEach(bucket => {
        allAttempts.push(...bucket.attempts);
      });

      // Count attempts with features
      const withKinematics = allAttempts.filter(a => 
        a.kinematics && Object.keys(a.kinematics).length > 0
      ).length;
      const withFitts = allAttempts.filter(a => 
        a.fitts && Object.keys(a.fitts).length > 0
      ).length;
      const withColumn = allAttempts.filter(a => 
        a.column !== null && a.column !== undefined
      ).length;
      const hits = allAttempts.filter(a => a.click?.hit === true).length;
      const misses = allAttempts.filter(a => a.click?.hit === false).length;

      console.log('📊 FEATURE COVERAGE:');
      console.log(`   Total Attempts: ${allAttempts.length}`);
      console.log(`   - Hits: ${hits}`);
      console.log(`   - Misses: ${misses}`);
      console.log(`   With column field: ${withColumn}/${allAttempts.length} (${(withColumn/allAttempts.length*100).toFixed(1)}%)`);
      console.log(`   With kinematics: ${withKinematics}/${allAttempts.length} (${(withKinematics/allAttempts.length*100).toFixed(1)}%)`);
      console.log(`   With Fitts metrics: ${withFitts}/${allAttempts.length} (${(withFitts/allAttempts.length*100).toFixed(1)}%)`);
      console.log('');

      // Show sample successful attempt with full features
      const successfulAttempt = allAttempts.find(a => 
        a.click?.hit === true && 
        a.kinematics && 
        Object.keys(a.kinematics).length > 0
      );

      if (successfulAttempt) {
        console.log('✅ SAMPLE SUCCESSFUL ATTEMPT (with features):');
        console.log('─'.repeat(80));
        console.log(`Attempt ID: ${successfulAttempt.attemptId}`);
        console.log(`Bubble ID: ${successfulAttempt.bubbleId}`);
        console.log(`Round: ${successfulAttempt.round}`);
        console.log(`Column: ${successfulAttempt.column}`);
        console.log(`Speed (normalized): ${successfulAttempt.speedNorm?.toFixed(4) || 'N/A'}`);
        console.log('');
        
        console.log('🎯 Target:');
        console.log(`   x: ${successfulAttempt.target?.x?.toFixed(4) || 'N/A'}`);
        console.log(`   y: ${successfulAttempt.target?.y?.toFixed(4) || 'N/A'}`);
        console.log(`   radius: ${successfulAttempt.target?.radius?.toFixed(4) || 'N/A'}`);
        console.log('');
        
        console.log('👆 Click:');
        console.log(`   clicked: ${successfulAttempt.click?.clicked}`);
        console.log(`   hit: ${successfulAttempt.click?.hit}`);
        console.log(`   x: ${successfulAttempt.click?.x?.toFixed(4) || 'N/A'}`);
        console.log(`   y: ${successfulAttempt.click?.y?.toFixed(4) || 'N/A'}`);
        console.log('');
        
        if (successfulAttempt.timing) {
          console.log('⏱️  Timing:');
          console.log(`   reactionTimeMs: ${successfulAttempt.timing.reactionTimeMs?.toFixed(0) || 'N/A'}`);
          console.log(`   movementTimeMs: ${successfulAttempt.timing.movementTimeMs?.toFixed(0) || 'N/A'}`);
          console.log(`   interTapMs: ${successfulAttempt.timing.interTapMs?.toFixed(0) || 'N/A'}`);
          console.log('');
        }
        
        if (successfulAttempt.spatial) {
          console.log('📐 Spatial:');
          console.log(`   errorDistNorm: ${successfulAttempt.spatial.errorDistNorm?.toFixed(4) || 'N/A'}`);
          console.log(`   pathLengthNorm: ${successfulAttempt.spatial.pathLengthNorm?.toFixed(4) || 'N/A'}`);
          console.log(`   directDistNorm: ${successfulAttempt.spatial.directDistNorm?.toFixed(4) || 'N/A'}`);
          console.log(`   straightness: ${successfulAttempt.spatial.straightness?.toFixed(4) || 'N/A'}`);
          console.log('');
        }
        
        if (successfulAttempt.kinematics) {
          console.log('🏃 Kinematics:');
          console.log(`   meanSpeed: ${successfulAttempt.kinematics.meanSpeed?.toFixed(4) || 'N/A'}`);
          console.log(`   peakSpeed: ${successfulAttempt.kinematics.peakSpeed?.toFixed(4) || 'N/A'}`);
          console.log(`   speedVar: ${successfulAttempt.kinematics.speedVar?.toFixed(4) || 'N/A'}`);
          console.log(`   meanAccel: ${successfulAttempt.kinematics.meanAccel?.toFixed(4) || 'N/A'}`);
          console.log(`   peakAccel: ${successfulAttempt.kinematics.peakAccel?.toFixed(4) || 'N/A'}`);
          console.log(`   jerkRMS: ${successfulAttempt.kinematics.jerkRMS?.toFixed(4) || 'N/A'}`);
          console.log(`   submovementCount: ${successfulAttempt.kinematics.submovementCount || 0}`);
          console.log(`   overshootCount: ${successfulAttempt.kinematics.overshootCount || 0}`);
          console.log('');
        }
        
        if (successfulAttempt.fitts) {
          console.log('📊 Fitts\' Law:');
          console.log(`   D (distance): ${successfulAttempt.fitts.D?.toFixed(4) || 'N/A'}`);
          console.log(`   W (width): ${successfulAttempt.fitts.W?.toFixed(4) || 'N/A'}`);
          console.log(`   ID (index of difficulty): ${successfulAttempt.fitts.ID?.toFixed(4) || 'N/A'}`);
          console.log(`   throughput (bits/sec): ${successfulAttempt.fitts.throughput?.toFixed(4) || 'N/A'}`);
          console.log('');
        }
      } else {
        console.log('⚠️  No successful attempts with full features found');
        console.log('');
        
        // Show what we do have
        const anyAttempt = allAttempts[0];
        console.log('📄 SAMPLE ATTEMPT (raw):');
        console.log(JSON.stringify(anyAttempt, null, 2));
        console.log('');
      }

      // Check for common issues
      console.log('🔍 DATA QUALITY CHECKS:');
      const missingColumn = allAttempts.filter(a => a.column === null || a.column === undefined);
      const missingTarget = allAttempts.filter(a => !a.target || (a.target.x === 0 && a.target.y === 0));
      const hitsWithoutKinematics = allAttempts.filter(a => a.click?.hit === true && (!a.kinematics || Object.keys(a.kinematics).length === 0));
      
      if (missingColumn.length > 0) {
        console.log(`   ⚠️  ${missingColumn.length} attempts missing column field`);
      } else {
        console.log(`   ✅ All attempts have column field`);
      }
      
      if (missingTarget.length > 0) {
        console.log(`   ⚠️  ${missingTarget.length} attempts have invalid target coordinates (0,0)`);
      } else {
        console.log(`   ✅ All attempts have valid target coordinates`);
      }
      
      if (hitsWithoutKinematics.length > 0) {
        console.log(`   ⚠️  ${hitsWithoutKinematics.length} successful hits missing kinematic features`);
        console.log(`       This indicates feature extraction failed or wasn't run`);
      } else {
        console.log(`   ✅ All successful hits have kinematic features`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkMotorFeatures();

