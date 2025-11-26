/**
 * Enhanced Motor Skills Tracking
 * Comprehensive tracking for the bubble-pop game
 */

import { logMotorSkillsInteraction } from './api';

class MotorSkillsTracker {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.interactions = [];
    this.touchStartTimes = new Map();
    this.lastTapTime = 0;
    this.lastPosition = null;
    this.velocityHistory = [];
    this.trajectoryPoints = [];
    this.round = 1;
  }

  // Track bubble spawn
  trackBubbleSpawn(bubbleData) {
    this.logInteraction('bubble_spawn', {
      bubbleId: bubbleData.id,
      column: bubbleData.column,
      speed: bubbleData.speed,
      round: this.round,
      spawnTime: bubbleData.spawnTime,
      initialPosition: {
        x: bubbleData.x,
        y: bubbleData.y,
      },
    });
  }

  // Track mouse/touch down
  trackPointerDown(event, bubbleId = null) {
    const now = Date.now();
    const coords = this.getCoordinates(event);
    
    this.touchStartTimes.set(bubbleId || 'screen', now);
    this.lastPosition = coords;
    this.trajectoryPoints = [{ ...coords, time: now }];
    
    this.logInteraction('pointer_down', {
      coordinates: coords,
      bubbleId,
      pointerType: event.pointerType || (event.touches ? 'touch' : 'mouse'),
      pressure: event.pressure || (event.touches?.[0]?.force) || 0,
      touchArea: event.touches?.[0] ? {
        radiusX: event.touches[0].radiusX,
        radiusY: event.touches[0].radiusY,
      } : null,
      round: this.round,
    });
  }

  // Track movement (for velocity, acceleration, trajectory)
  trackPointerMove(event) {
    const now = Date.now();
    const coords = this.getCoordinates(event);
    
    if (this.lastPosition) {
      const dt = now - (this.trajectoryPoints[this.trajectoryPoints.length - 1]?.time || now);
      if (dt > 0) {
        const dx = coords.x - this.lastPosition.x;
        const dy = coords.y - this.lastPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / (dt / 1000); // pixels per second
        
        // Calculate acceleration
        const acceleration = this.velocityHistory.length > 0
          ? (velocity - this.velocityHistory[this.velocityHistory.length - 1].velocity) / (dt / 1000)
          : 0;
        
        // Track velocity history
        this.velocityHistory.push({
          velocity,
          acceleration,
          time: now,
        });
        
        // Keep only recent history (last 10 points)
        if (this.velocityHistory.length > 10) {
          this.velocityHistory.shift();
        }
        
        // Add to trajectory
        this.trajectoryPoints.push({
          ...coords,
          time: now,
          velocity,
          acceleration,
        });
        
        // Calculate jerkiness (change in acceleration)
        const jerkiness = this.calculateJerkiness();
        
        this.logInteraction('pointer_move', {
          coordinates: coords,
          velocity: velocity.toFixed(2),
          acceleration: acceleration.toFixed(2),
          jerkiness: jerkiness.toFixed(2),
          round: this.round,
        });
      }
    }
    
    this.lastPosition = coords;
  }

  // Track pointer up (end of tap/click)
  trackPointerUp(event, bubbleId = null, bubbleHit = false) {
    const now = Date.now();
    const coords = this.getCoordinates(event);
    const startTime = this.touchStartTimes.get(bubbleId || 'screen');
    const touchDuration = startTime ? now - startTime : 0;
    
    // Inter-tap interval
    const interTapInterval = this.lastTapTime ? now - this.lastTapTime : 0;
    this.lastTapTime = now;
    
    // Calculate trajectory metrics
    const trajectoryMetrics = this.analyzeTrajectory();
    
    // Clear tracking data
    this.touchStartTimes.delete(bubbleId || 'screen');
    this.velocityHistory = [];
    this.trajectoryPoints = [];
    this.lastPosition = null;
    
    this.logInteraction(bubbleHit ? 'bubble_hit' : 'stage_clicked_miss', {
      coordinates: coords,
      bubbleId,
      touchDuration,
      interTapInterval,
      trajectoryMetrics,
      round: this.round,
      success: bubbleHit,
    });
  }

  // Track bubble hit (successful click)
  trackBubbleHit(bubbleData, event) {
    const now = Date.now();
    const reactionTime = now - bubbleData.spawnTime;
    const coords = this.getCoordinates(event);
    
    // Calculate accuracy (distance from bubble center)
    const dx = coords.x - bubbleData.x;
    const dy = coords.y - bubbleData.y;
    const clickAccuracy = Math.sqrt(dx * dx + dy * dy);
    
    this.logInteraction('bubble_hit', {
      bubbleId: bubbleData.id,
      coordinates: coords,
      bubblePosition: { x: bubbleData.x, y: bubbleData.y },
      clickAccuracy: clickAccuracy.toFixed(2),
      reactionTime,
      bubbleLifetime: now - bubbleData.spawnTime,
      bubbleSpeed: bubbleData.speed,
      column: bubbleData.column,
      round: this.round,
    });
  }

  // Track missed bubble (escaped)
  trackBubbleMiss(bubbleData) {
    this.logInteraction('bubble_miss', {
      bubbleId: bubbleData.id,
      column: bubbleData.column,
      bubbleSpeed: bubbleData.speed,
      bubbleLifetime: Date.now() - bubbleData.spawnTime,
      round: this.round,
    });
  }

  // Track round completion
  trackRoundComplete(roundData) {
    const totalAttempts = roundData.hits + roundData.misses;
    const successRate = totalAttempts > 0 ? (roundData.hits / totalAttempts * 100).toFixed(2) : 0;
    
    this.logInteraction('round_end', {
      round: this.round,
      hits: roundData.hits,
      misses: roundData.misses,
      escaped: roundData.escaped,
      successRate,
      totalAttempts,
      roundDuration: roundData.duration,
      averageReactionTime: roundData.averageReactionTime,
    });
    
    this.round++;
  }

  // Helper: Get coordinates from event
  getCoordinates(event) {
    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
    return {
      x: event.clientX || 0,
      y: event.clientY || 0,
    };
  }

  // Helper: Calculate jerkiness (variability in acceleration)
  calculateJerkiness() {
    if (this.velocityHistory.length < 3) return 0;
    
    const accelerations = this.velocityHistory.map(v => v.acceleration);
    const mean = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    const variance = accelerations.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accelerations.length;
    
    return Math.sqrt(variance);
  }

  // Helper: Analyze trajectory path
  analyzeTrajectory() {
    if (this.trajectoryPoints.length < 2) {
      return {
        pathLength: 0,
        straightness: 1,
        smoothness: 1,
        pointCount: this.trajectoryPoints.length,
      };
    }
    
    // Calculate total path length
    let pathLength = 0;
    for (let i = 1; i < this.trajectoryPoints.length; i++) {
      const dx = this.trajectoryPoints[i].x - this.trajectoryPoints[i - 1].x;
      const dy = this.trajectoryPoints[i].y - this.trajectoryPoints[i - 1].y;
      pathLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate straight-line distance
    const first = this.trajectoryPoints[0];
    const last = this.trajectoryPoints[this.trajectoryPoints.length - 1];
    const straightDistance = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    // Straightness: ratio of straight distance to path length (1 = perfectly straight)
    const straightness = straightDistance / pathLength;
    
    // Smoothness: based on velocity consistency
    const velocities = this.trajectoryPoints.filter(p => p.velocity).map(p => p.velocity);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVariance = velocities.reduce((sum, v) => 
      sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    const smoothness = 1 / (1 + Math.sqrt(velocityVariance) / avgVelocity);
    
    return {
      pathLength: pathLength.toFixed(2),
      straightDistance: straightDistance.toFixed(2),
      straightness: straightness.toFixed(3),
      smoothness: smoothness.toFixed(3),
      pointCount: this.trajectoryPoints.length,
      averageVelocity: avgVelocity.toFixed(2),
    };
  }

  // Helper: Log interaction
  logInteraction(eventType, data) {
    const interaction = {
      sessionId: this.sessionId,
      round: this.round,
      eventType,
      timestamp: Date.now(),
      ...data,
    };
    
    this.interactions.push(interaction);
    
    // Send to backend (dedicated motor skills endpoint)
    logMotorSkillsInteraction(interaction).catch(error => {
      console.error('Motor skills tracking error:', error);
    });
  }

  // Get all interactions
  getAllInteractions() {
    return this.interactions;
  }
}

export default MotorSkillsTracker;

