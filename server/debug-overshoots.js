import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MotorAttemptBucket from './models/MotorAttemptBucket.js';
import MotorPointerTraceBucket from './models/MotorPointerTraceBucket.js';

dotenv.config();

// Helper: Distance between two points
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

async function debugOvershoots() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');
  
  // Get the latest session with attempts
  const latestBucket = await MotorAttemptBucket.findOne().sort({ createdAt: -1 });
  
  if (!latestBucket || !latestBucket.attempts.length) {
    console.log('No attempts found');
    await mongoose.disconnect();
    return;
  }
  
  const sessionId = latestBucket.sessionId;
  console.log('Session ID:', sessionId);
  
  // Get all pointer samples for this session
  const pointerBuckets = await MotorPointerTraceBucket.find({ sessionId });
  const allSamples = [];
  pointerBuckets.forEach(b => allSamples.push(...b.samples));
  console.log('Total pointer samples:', allSamples.length);
  
  // Get all buckets for this session
  const allBuckets = await MotorAttemptBucket.find({ sessionId });
  const allAttempts = [];
  allBuckets.forEach(b => allAttempts.push(...b.attempts));
  
  // Find HIT attempts only
  const hitAttempts = allAttempts.filter(a => a.click?.hit === true);
  console.log('Total attempts:', allAttempts.length);
  console.log('Hit attempts:', hitAttempts.length);
  
  if (hitAttempts.length === 0) {
    console.log('\nNo hit attempts found!');
    await mongoose.disconnect();
    return;
  }
  
  // Analyze last 3 hit attempts
  const attempts = hitAttempts.slice(-3);
  
  for (const attempt of attempts) {
    console.log('\n' + '='.repeat(70));
    console.log('Attempt:', attempt.bubbleId);
    console.log('Round:', attempt.round);
    
    // Get samples for this attempt
    const spawnTms = attempt.spawnTms;
    const clickTms = attempt.click?.tms;
    
    if (!spawnTms || !clickTms) {
      console.log('Missing timing data');
      continue;
    }
    
    const attemptSamples = allSamples.filter(s => s.tms >= spawnTms && s.tms <= clickTms);
    console.log('Samples in attempt window:', attemptSamples.length);
    
    if (attemptSamples.length < 4) {
      console.log('NOT ENOUGH SAMPLES');
      continue;
    }
    
    // Sort by time
    attemptSamples.sort((a, b) => a.tms - b.tms);
    
    const target = attempt.target;
    const gate = 4 * target.radius; // 4x radius gate
    
    console.log('\nTarget: x=' + target.x.toFixed(4) + ', y=' + target.y.toFixed(4));
    console.log('Gate (4 * radius):', gate.toFixed(6));
    
    // Calculate distances
    const d = attemptSamples.map(s => dist(s, target));
    
    console.log('\nDistances: min=' + Math.min(...d).toFixed(4) + ', max=' + Math.max(...d).toFixed(4));
    console.log('Samples within gate:', d.filter(x => x < gate).length);
    
    // METHOD 1: Distance reversal detection
    let distanceReversals = 0;
    for (let i = 2; i < d.length; i++) {
      const ddPrev = d[i-1] - d[i-2];
      const dd = d[i] - d[i-1];
      if (ddPrev < -0.001 && dd > 0.001 && d[i] < gate) {
        distanceReversals++;
      }
    }
    
    // METHOD 2: Final phase detection
    let finalPhaseOvershoots = 0;
    const finalPhaseStart = Math.floor(attemptSamples.length * 0.7);
    const finalSeg = attemptSamples.slice(finalPhaseStart);
    const finalD = finalSeg.map(s => dist(s, target));
    
    for (let i = 2; i < finalD.length; i++) {
      const ddPrev = finalD[i-1] - finalD[i-2];
      const dd = finalD[i] - finalD[i-1];
      if (ddPrev < -0.001 && dd > 0.001) {
        finalPhaseOvershoots++;
      }
    }
    
    // METHOD 3: Position oscillation detection (X/Y direction changes)
    let oscillationCount = 0;
    for (let i = 3; i < attemptSamples.length; i++) {
      if (d[i] < gate) {
        const dxPrev = attemptSamples[i-1].x - attemptSamples[i-2].x;
        const dx = attemptSamples[i].x - attemptSamples[i-1].x;
        const xReversal = (dxPrev > 0.002 && dx < -0.002) || (dxPrev < -0.002 && dx > 0.002);
        
        const dyPrev = attemptSamples[i-1].y - attemptSamples[i-2].y;
        const dy = attemptSamples[i].y - attemptSamples[i-1].y;
        const yReversal = (dyPrev > 0.002 && dy < -0.002) || (dyPrev < -0.002 && dy > 0.002);
        
        if (xReversal || yReversal) {
          oscillationCount++;
          console.log(`  Oscillation at ${i}: dx ${dxPrev.toFixed(4)} → ${dx.toFixed(4)}, dy ${dyPrev.toFixed(4)} → ${dy.toFixed(4)}`);
        }
      }
    }
    
    console.log('\n--- Detection Results ---');
    console.log('Method 1 (distance reversal):', distanceReversals);
    console.log('Method 2 (final phase):', finalPhaseOvershoots);
    console.log('Method 3 (oscillation):', oscillationCount);
    console.log('Final overshootCount:', Math.max(distanceReversals, finalPhaseOvershoots, oscillationCount));
    console.log('Stored overshootCount:', attempt.kinematics?.overshootCount ?? 'N/A');
    
    // Show movement pattern (condensed)
    console.log('\n--- Movement Pattern (unique positions near target) ---');
    let shown = 0;
    let prevPos = null;
    for (let i = 0; i < attemptSamples.length && shown < 20; i++) {
      const s = attemptSamples[i];
      if (d[i] < gate * 2) { // Show positions when reasonably close
        if (!prevPos || Math.abs(s.x - prevPos.x) > 0.002 || Math.abs(s.y - prevPos.y) > 0.002) {
          const direction = i > 0 
            ? `Δd=${(d[i] - d[i-1]).toFixed(4)} (${d[i] < d[i-1] ? 'approaching' : 'receding'})`
            : '';
          console.log(`  [${i}] x=${s.x.toFixed(4)}, y=${s.y.toFixed(4)}, dist=${d[i].toFixed(4)} ${direction}`);
          prevPos = s;
          shown++;
        }
      }
    }
  }
  
  await mongoose.disconnect();
  console.log('\n\nDone');
}

debugOvershoots().catch(console.error);
