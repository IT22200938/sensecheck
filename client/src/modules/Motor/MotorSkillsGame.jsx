import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Circle, Rect } from 'react-konva';
import Layout from '../../components/Layout';
import useStore from '../../state/store';
import MotorSkillsTracker from '../../utils/motorSkillsTracking';

// Bubble patterns for each round - consistent across players
const BUBBLE_PATTERNS = [
  // Round 1: Slow, simple pattern
  {
    speed: 1.5,
    spawnInterval: 1200,
    duration: 20000,
    pattern: [0, 1, 2, 3, 4, 0, 2, 4, 1, 3, 2, 0, 4, 1, 3],
  },
  // Round 2: Medium speed, more bubbles
  {
    speed: 2.5,
    spawnInterval: 900,
    duration: 20000,
    pattern: [1, 3, 0, 4, 2, 1, 3, 0, 2, 4, 1, 0, 3, 2, 4, 1, 3],
  },
  // Round 3: Fast, complex pattern
  {
    speed: 3.5,
    spawnInterval: 700,
    duration: 20000,
    pattern: [2, 0, 4, 1, 3, 2, 4, 0, 3, 1, 4, 2, 0, 3, 1, 4, 2, 0, 1, 3],
  },
];

const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const COLUMN_WIDTH = STAGE_WIDTH / 5;
const BUBBLE_RADIUS = 25;

const MotorSkillsGame = () => {
  const navigate = useNavigate();
  const sessionId = useStore((state) => state.sessionId);
  const { setMotorRound, completeMotorSkillsTest, completeModule } = useStore();
  
  // Enhanced motor skills tracking (only for this module)
  const motorTrackerRef = useRef(null);

  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [isComplete, setIsComplete] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); // Prevent restart during completion
  const [interactions, setInteractions] = useState([]);

  const bubblesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const roundTimerRef = useRef(null);
  const patternIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const cursorSamplingRef = useRef(null);
  const stageRef = useRef(null);

  const currentPattern = BUBBLE_PATTERNS[currentRound - 1];
  
  // Initialize motor skills tracker
  useEffect(() => {
    if (!motorTrackerRef.current && sessionId) {
      motorTrackerRef.current = new MotorSkillsTracker(sessionId);
      console.log('🎯 Motor skills enhanced tracking initialized');
    }
  }, [sessionId]);
  
  // Update isPlaying ref to avoid stale closure issues
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Generate unique bubble ID
  const generateBubbleId = () => {
    return `bubble_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Spawn a new bubble
  const spawnBubble = useCallback(() => {
    if (!isPlayingRef.current) return;

    const pattern = BUBBLE_PATTERNS[currentRound - 1];
    const columnIndex = pattern.pattern[patternIndexRef.current % pattern.pattern.length];
    patternIndexRef.current++;

    const newBubble = {
      id: generateBubbleId(),
      x: columnIndex * COLUMN_WIDTH + COLUMN_WIDTH / 2,
      y: STAGE_HEIGHT,
      column: columnIndex,
      speed: pattern.speed,
      radius: BUBBLE_RADIUS,
      spawnTime: Date.now(),
    };

    bubblesRef.current.push(newBubble);
    setBubbles([...bubblesRef.current]);

    // Track bubble spawn with enhanced tracker
    if (motorTrackerRef.current) {
      motorTrackerRef.current.trackBubbleSpawn(newBubble);
    }
  }, [currentRound]);

  // Animation loop
  const animate = useCallback(() => {
    const now = Date.now();
    const updatedBubbles = bubblesRef.current.filter((bubble) => {
      bubble.y -= bubble.speed;
      
      // Remove if off screen (top of canvas)
      if (bubble.y < -BUBBLE_RADIUS) {
        // Track bubble escape with enhanced tracker
        if (motorTrackerRef.current) {
          motorTrackerRef.current.trackBubbleMiss(bubble);
        }
        return false;
      }
      return true;
    });

    bubblesRef.current = updatedBubbles;
    setBubbles([...updatedBubbles]);
    
    // Continue animation loop using ref to avoid stale closure
    if (isPlayingRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // Handle bubble click
  const handleBubbleClick = (bubble, event) => {
    // Track bubble hit with enhanced metrics
    if (motorTrackerRef.current) {
      motorTrackerRef.current.trackBubbleHit(bubble, event.evt);
      // NOTE: Don't call trackPointerUp here - it creates duplicate events!
      // trackBubbleHit already logs all the data we need
    }

    // Remove bubble
    bubblesRef.current = bubblesRef.current.filter((b) => b.id !== bubble.id);
    setBubbles([...bubblesRef.current]);
  };

  // Handle stage click (miss)
  const handleStageClick = (event) => {
    // Track missed click with enhanced tracker
    if (motorTrackerRef.current) {
      motorTrackerRef.current.trackPointerUp(event.evt, null, false);
    }
  };

  // Track mouse/touch movement during game
  const handlePointerMove = (event) => {
    if (!isPlaying || !motorTrackerRef.current) return;
    
    // Track movement for velocity, acceleration, trajectory
    motorTrackerRef.current.trackPointerMove(event.evt);
  };
  
  // Track pointer down
  const handlePointerDown = (event) => {
    if (!isPlaying || !motorTrackerRef.current) return;
    
    motorTrackerRef.current.trackPointerDown(event.evt);
  };

  // Continuous cursor sampling at 60Hz for better feature extraction
  const sampleCursorPosition = useCallback(() => {
    if (!isPlayingRef.current) return;
    
    const stage = stageRef.current;
    if (stage && motorTrackerRef.current) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Create a fake event object with the cursor position
        const fakeEvent = {
          clientX: pointerPos.x,
          clientY: pointerPos.y,
        };
        motorTrackerRef.current.trackPointerMove(fakeEvent);
      }
    }
    
    // Continue sampling
    cursorSamplingRef.current = requestAnimationFrame(sampleCursorPosition);
  }, []);

  // Start round
  const startRound = () => {
    setIsPlaying(true);
    isPlayingRef.current = true; // Set ref synchronously for animation loop
    setRoundStartTime(Date.now());
    setTimeRemaining(currentPattern.duration / 1000);
    patternIndexRef.current = 0;
    bubblesRef.current = [];
    setBubbles([]);

    setMotorRound(currentRound);
    
    // Update tracker round
    if (motorTrackerRef.current) {
      motorTrackerRef.current.round = currentRound;
    }

    // Start spawning bubbles
    spawnTimerRef.current = setInterval(() => {
      spawnBubble();
    }, currentPattern.spawnInterval);

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Start continuous cursor sampling at 60Hz
    cursorSamplingRef.current = requestAnimationFrame(sampleCursorPosition);

    // Round timer
    const startTime = Date.now();
    roundTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((currentPattern.duration - elapsed) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        endRound();
      }
    }, 100);
  };

  // End round
  const endRound = async () => {
    setIsPlaying(false);
    isPlayingRef.current = false; // Set ref synchronously to stop animation
    
    // Clear timers
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (cursorSamplingRef.current) {
      cancelAnimationFrame(cursorSamplingRef.current);
      cursorSamplingRef.current = null;
    }

    // Track round completion and send to ML schemas
    if (motorTrackerRef.current) {
      try {
        // Calculate hits and misses from tracker's logged interactions
        const allInteractions = motorTrackerRef.current.getAllInteractions();
        const roundInteractions = allInteractions.filter(i => i.round === currentRound);
        const hits = roundInteractions.filter(i => i.eventType === 'bubble_hit').length;
        const misses = roundInteractions.filter(i => i.eventType === 'bubble_miss').length;
        
        await motorTrackerRef.current.trackRoundComplete({
          hits: hits,
          misses: misses,
          escaped: misses, // Escaped bubbles are the same as misses
          duration: BUBBLE_PATTERNS[currentRound - 1].duration,
          averageReactionTime: 0, // Could calculate this if needed
        });
      } catch (error) {
        console.error('Error tracking round completion:', error);
        // Continue game even if tracking fails
      }
    }

    // Clear remaining bubbles
    bubblesRef.current = [];
    setBubbles([]);

    // Move to next round or complete
    if (currentRound < 3) {
      setTimeout(() => {
        setCurrentRound((prev) => prev + 1);
      }, 2000);
    } else {
      // Mark as completing to prevent button from showing
      setIsCompleting(true);
      setTimeout(() => {
        completeTest();
      }, 500);
    }
  };

  // Complete test
  const completeTest = async () => {
    completeMotorSkillsTest();
    
    // Flush remaining motor skills interactions
    if (motorTrackerRef.current) {
      try {
        await motorTrackerRef.current.complete();
        const totalInteractions = motorTrackerRef.current.getAllInteractions().length;
        console.log(`🎯 Motor skills tracking complete: ${totalInteractions} enhanced events tracked`);
      } catch (error) {
        console.error('Error completing motor skills tracking:', error);
      }
    }
    
    // Mark module as completed
    try {
      await completeModule('reaction');
    } catch (error) {
      console.error('Error completing module:', error);
    }
    
    // Always set complete, even if tracking fails
    setIsComplete(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  if (isComplete) {
    return (
      <Layout title="Motor Skills Assessment Complete" subtitle="Reaction Lab">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-3xl font-bold mb-6">Assessment Complete!</h3>
            
            <div className="bg-gray-700/50 p-6 rounded-lg mb-6">
              <p className="text-lg text-gray-300">
                Your motor skill interactions have been recorded successfully.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Enhanced metrics tracked: <span className="font-bold text-cyber-blue-400">
                  {motorTrackerRef.current?.getAllInteractions().length || 0}
                </span> events
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Including velocity, acceleration, trajectory, and accuracy data
              </p>
            </div>

            <div className="bg-cyan-900/30 border border-cyan-500/30 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-300">
                <strong>Note:</strong> This module tracks interaction patterns only.
                All your clicks, movements, and response times have been logged for analysis.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Return to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Motor Skills Assessment" subtitle="Reaction Lab">
      <div className="max-w-5xl mx-auto">
        {/* Round Info */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">
                Round {currentRound} of 3
              </h3>
              <p className="text-gray-400">
                {isPlaying ? 'Pop the rising bubbles!' : 'Ready to start?'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-cyber-blue-400">
                {timeRemaining}s
              </div>
              <div className="text-sm text-gray-400">Time Remaining</div>
            </div>
          </div>

          {!isPlaying && !isCompleting && (
            <button
              onClick={startRound}
              className="btn-primary w-full mt-4"
            >
              {currentRound === 1 ? 'Start Game' : `Start Round ${currentRound}`}
            </button>
          )}
          
          {isCompleting && (
            <div className="text-center mt-4 text-cyber-blue-400 animate-pulse">
              Completing assessment...
            </div>
          )}
        </div>

        {/* Game Stage */}
        <div className="card bg-gray-900">
          <div
            style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
            className="mx-auto bg-gradient-to-b from-blue-950 to-purple-950 rounded-lg overflow-hidden relative"
          >
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              onClick={handleStageClick}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
            >
              <Layer>
                {/* Column dividers (vertical lines) */}
                {[1, 2, 3, 4].map((i) => (
                  <Rect
                    key={`divider-${i}`}
                    x={i * COLUMN_WIDTH}
                    y={0}
                    width={1}
                    height={STAGE_HEIGHT}
                    fill="rgba(255, 255, 255, 0.1)"
                  />
                ))}

                {/* Bubbles */}
                {bubbles.map((bubble) => (
                  <Circle
                    key={bubble.id}
                    x={bubble.x}
                    y={bubble.y}
                    radius={bubble.radius}
                    fill="rgba(100, 200, 255, 0.8)"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth={2}
                    onClick={(e) => handleBubbleClick(bubble, e)}
                    onTap={(e) => handleBubbleClick(bubble, e)}
                    shadowColor="cyan"
                    shadowBlur={10}
                    shadowOpacity={0.6}
                  />
                ))}
              </Layer>
            </Stage>

            {/* Column labels */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-around text-white/50 text-xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ width: COLUMN_WIDTH }} className="text-center">
                  Column {i}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card mt-6 bg-cyber-blue-900/20 border-cyber-blue-500/50">
          <h4 className="font-bold mb-2">💡 Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Click or tap on the rising bubbles to pop them</li>
            <li>• Bubbles rise through 5 vertical columns</li>
            <li>• Each round increases in speed and complexity</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default MotorSkillsGame;

