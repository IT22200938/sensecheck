import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text } from 'react-konva';
import { bubbleGameConfig } from '../utils/gameData';
import { useTimer } from '../hooks/useGameState';

const BubbleGame = ({ onComplete, gameState }) => {
  const [bubbles, setBubbles] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameStats, setGameStats] = useState({
    totalBubbles: 0,
    poppedBubbles: 0,
    missedBubbles: 0,
    rounds: []
  });
  const [roundStats, setRoundStats] = useState({
    bubbles: 0,
    popped: 0,
    reactionTimes: []
  });
  const [gameActive, setGameActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [roundTimeLeft, setRoundTimeLeft] = useState(20);
  
  const timer = useTimer();
  const bubbleIdRef = useRef(0);
  const globalBubbleCountRef = useRef(0); // Global counter across all rounds
  const spawnIntervalRef = useRef(null);
  const bubbleAnimationRef = useRef(null);
  const roundTimerRef = useRef(null);
  
  const config = bubbleGameConfig.rounds[currentRound] || bubbleGameConfig.rounds[0];
  
  // Initialize game on first load
  useEffect(() => {
    // Reset global counter when component mounts
    globalBubbleCountRef.current = 0;
  }, []);

  // Start countdown and game
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!gameActive) {
      startRound();
    }
  }, [countdown, gameActive]);
  
  const generateBubble = useCallback(() => {
    const fixedSize = bubbleGameConfig.bubbleSize;
    
    // Use global bubble counter for continuous pattern across all rounds
    const globalCount = globalBubbleCountRef.current;
    const patternIndex = globalCount % bubbleGameConfig.lanePattern.length;
    const laneIndex = bubbleGameConfig.lanePattern[patternIndex];
    const xPosition = bubbleGameConfig.xPositions[laneIndex];
    
    // Predefined colors in sequence for consistency
    const colorIndex = globalCount % bubbleGameConfig.bubbleColors.length;
    
    const bubble = {
      id: bubbleIdRef.current++,
      x: xPosition,
      y: bubbleGameConfig.containerHeight + fixedSize,
      size: fixedSize,
      color: bubbleGameConfig.bubbleColors[colorIndex],
      speed: config.bubbleSpeed, // Fixed speed per round, no random variation
      spawnTime: Date.now(),
      lane: laneIndex, // Track which lane (0-4) for analysis
      patternPosition: patternIndex, // Track position in pattern sequence
      globalIndex: globalCount // Track global bubble number
    };
    
    // Increment global counter
    globalBubbleCountRef.current++;
    
    setBubbles(prev => [...prev, bubble]);
    setRoundStats(prev => ({ ...prev, bubbles: prev.bubbles + 1 }));
  }, [config.bubbleSpeed]);
  
  const startRound = useCallback(() => {
    setGameActive(true);
    setRoundTimeLeft(20); // Reset to 20 seconds
    timer.restart();
    
    // Start round countdown timer
    roundTimerRef.current = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 1) {
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start spawning bubbles
    spawnIntervalRef.current = setInterval(generateBubble, config.spawnRate);
    
    // Start bubble animation
    const animateBubbles = () => {
      setBubbles(prev => {
        return prev
          .map(bubble => ({
            ...bubble,
            y: bubble.y - bubble.speed
          }))
          .filter(bubble => {
            if (bubble.y < -bubble.size) {
              // Bubble reached top - missed
              setGameStats(prevStats => ({
                ...prevStats,
                missedBubbles: prevStats.missedBubbles + 1
              }));
              return false;
            }
            return true;
          });
      });
      
      bubbleAnimationRef.current = requestAnimationFrame(animateBubbles);
    };
    
    bubbleAnimationRef.current = requestAnimationFrame(animateBubbles);
  }, [config, generateBubble, timer]);
  
  const endRound = useCallback(() => {
    setGameActive(false);
    timer.stop();
    
    // Clear intervals and timers
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    if (bubbleAnimationRef.current) {
      cancelAnimationFrame(bubbleAnimationRef.current);
      bubbleAnimationRef.current = null;
    }
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    
    // Calculate round results
    const roundResult = {
      round: currentRound + 1,
      duration: config.duration,
      bubblesSpawned: roundStats.bubbles,
      bubblesPopped: roundStats.popped,
      accuracy: roundStats.bubbles > 0 ? (roundStats.popped / roundStats.bubbles) * 100 : 0,
      averageReactionTime: roundStats.reactionTimes.length > 0 
        ? roundStats.reactionTimes.reduce((a, b) => a + b, 0) / roundStats.reactionTimes.length 
        : 0
    };
    
    setGameStats(prev => ({
      totalBubbles: prev.totalBubbles + roundStats.bubbles,
      poppedBubbles: prev.poppedBubbles + roundStats.popped,
      missedBubbles: prev.missedBubbles + (roundStats.bubbles - roundStats.popped),
      rounds: [...prev.rounds, roundResult]
    }));
    
    // Move to next round or complete game
    if (currentRound < bubbleGameConfig.rounds.length - 1) {
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        setRoundStats({ bubbles: 0, popped: 0, reactionTimes: [] });
        setBubbles([]);
        setGameActive(false); // Reset game active state for countdown
        setCountdown(3); // Start countdown for next round
        setRoundTimeLeft(20); // Reset timer for next round
      }, 2000);
    } else {
      setTimeout(() => {
        completeGame();
      }, 2000);
    }
  }, [timer, config, roundStats, currentRound]);
  
  const popBubble = useCallback((bubbleId) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;
    
    const reactionTime = Date.now() - bubble.spawnTime;
    
    setBubbles(prev => prev.filter(b => b.id !== bubbleId));
    setRoundStats(prev => ({
      ...prev,
      popped: prev.popped + 1,
      reactionTimes: [...prev.reactionTimes, reactionTime]
    }));
  }, [bubbles]);
  
  const completeGame = useCallback(() => {
    const finalStats = {
      ...gameStats,
      totalBubbles: gameStats.totalBubbles + roundStats.bubbles,
      poppedBubbles: gameStats.poppedBubbles + roundStats.popped
    };
    
    gameState.updateGameData('bubbleGame', finalStats);
    onComplete();
  }, [gameStats, roundStats, gameState, onComplete]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      if (bubbleAnimationRef.current) cancelAnimationFrame(bubbleAnimationRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-cyber text-cyber-red mb-2">
            SYSTEM STABILITY PROTOCOL
          </h2>
          <p className="text-cyber-yellow">
            CRITICAL SYSTEM INSTABILITY DETECTED
          </p>
          <div className="text-sm text-gray-400 mt-2">
            Round {currentRound + 1} of {bubbleGameConfig.rounds.length}
          </div>
        </div>
        
        {/* Countdown */}
        {countdown > 0 && (
          <div className="text-center mb-8">
            <div className="text-6xl font-cyber text-cyber-blue animate-pulse-glow">
              {countdown}
            </div>
            <p className="text-cyber-green">INITIALIZING CONTAINMENT PROTOCOL...</p>
          </div>
        )}
        
        {/* Game Area */}
        <div className="cyber-panel p-4 mb-6">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-dark-bg to-dark-panel">
            <Stage 
              width={bubbleGameConfig.containerWidth} 
              height={bubbleGameConfig.containerHeight}
              className="border border-cyber-red"
            >
              <Layer>
                {/* Lane markers for visual reference */}
                {bubbleGameConfig.xPositions.map((x, index) => (
                  <React.Fragment key={`lane-${index}`}>
                    <Line
                      points={[x, 0, x, bubbleGameConfig.containerHeight]}
                      stroke="#333333"
                      strokeWidth={1}
                      opacity={0.4}
                      dash={[8, 8]}
                    />
                    {/* Lane number at the bottom */}
                    <Text
                      x={x}
                      y={bubbleGameConfig.containerHeight - 20}
                      text={`${index + 1}`}
                      fontSize={12}
                      fontFamily="Orbitron"
                      fill="#666666"
                      align="center"
                      offsetX={6}
                    />
                  </React.Fragment>
                ))}
                
                {bubbles.map(bubble => (
                  <Circle
                    key={bubble.id}
                    x={bubble.x}
                    y={bubble.y}
                    radius={bubble.size / 2}
                    fill={bubble.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    shadowColor={bubble.color}
                    shadowBlur={10}
                    opacity={0.9}
                    onClick={() => popBubble(bubble.id)}
                    onTap={() => popBubble(bubble.id)}
                    onMouseDown={() => popBubble(bubble.id)}
                    onTouchStart={() => popBubble(bubble.id)}
                    listening={true}
                    perfectDrawEnabled={false}
                    hitStrokeWidth={10}
                  />
                ))}
              </Layer>
            </Stage>
            
            {/* Warning line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-cyber-red animate-pulse"></div>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-cyber-red font-cyber mb-2">
              {gameActive ? 'NEUTRALIZE REACTOR PARTICLES!' : 
               countdown > 0 ? 'PREPARE FOR CONTAINMENT' : 'ROUND COMPLETE'}
            </div>
            {gameActive && (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-gray-400 font-mono">
                  Next lanes: {bubbleGameConfig.lanePattern.slice(
                    globalBubbleCountRef.current % bubbleGameConfig.lanePattern.length,
                    (globalBubbleCountRef.current % bubbleGameConfig.lanePattern.length) + 5
                  ).map(lane => lane + 1).join(' → ')}...
                </div>
                <div className="text-xs text-cyber-blue font-cyber">
                  Next bubble: Lane {bubbleGameConfig.lanePattern[globalBubbleCountRef.current % bubbleGameConfig.lanePattern.length] + 1}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="cyber-panel p-4 text-center">
            <div className="text-2xl font-cyber text-cyber-blue">
              {roundStats.popped}
            </div>
            <div className="text-sm text-gray-400">NEUTRALIZED</div>
          </div>
          
          <div className="cyber-panel p-4 text-center">
            <div className="text-2xl font-cyber text-cyber-yellow">
              {roundStats.bubbles - roundStats.popped}
            </div>
            <div className="text-sm text-gray-400">ESCAPED</div>
          </div>
          
          <div className="cyber-panel p-4 text-center">
            <div className="text-2xl font-cyber text-cyber-green">
              {roundStats.bubbles > 0 ? Math.round((roundStats.popped / roundStats.bubbles) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-400">ACCURACY</div>
          </div>
          
          <div className="cyber-panel p-4 text-center">
            <div className={`text-2xl font-cyber ${roundTimeLeft <= 5 ? 'text-cyber-red animate-pulse' : 'text-cyber-purple'}`}>
              {roundTimeLeft}s
            </div>
            <div className="text-sm text-gray-400">TIME LEFT</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BubbleGame;
