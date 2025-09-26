import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import { colorBlindnessPatterns, acuitySizes, generateRandomNumber, generateRandomPosition } from '../utils/gameData';
import { useTimer } from '../hooks/useGameState';

const SignalRecognition = ({ onComplete, gameState }) => {
  const [phase, setPhase] = useState('color'); // 'color' or 'acuity'
  const [currentSignal, setCurrentSignal] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [results, setResults] = useState({
    colorBlindness: [],
    acuity: []
  });
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(null);
  const acuityNumbersRef = useRef({}); // Store numbers for each size index
  const [acuityAttempts, setAcuityAttempts] = useState({}); // Track attempts per size
  
  const timer = useTimer();
  
  // Generate color blindness signal
  const generateColorSignal = useCallback((pattern) => {
    // Fixed position in center of canvas
    return {
      id: pattern.id,
      number: pattern.number,
      x: 200, // Center X
      y: 150, // Center Y
      colors: pattern.colors,
      correctAnswer: pattern.correctAnswer,
      type: pattern.type,
      size: 80
    };
  }, []);
  
  // Generate acuity signal
  const generateAcuitySignal = useCallback((sizeConfig, fixedNumber) => {
    // Fixed position in center of canvas
    return {
      id: `acuity_${sizeConfig.size}`,
      number: fixedNumber,
      x: 200, // Center X
      y: 150, // Center Y
      colors: ['#00f5ff'],
      correctAnswer: fixedNumber,
      size: sizeConfig.size,
      label: sizeConfig.label
    };
  }, []);
  
  // Start color blindness test
  useEffect(() => {
    if (phase === 'color' && currentPatternIndex < colorBlindnessPatterns.length) {
      const pattern = colorBlindnessPatterns[currentPatternIndex];
      const signal = generateColorSignal(pattern);
      setCurrentSignal(signal);
      timer.restart();
    }
  }, [phase, currentPatternIndex, generateColorSignal, timer]);
  
  // Start acuity test
  useEffect(() => {
    if (phase === 'acuity' && currentSizeIndex < acuitySizes.length) {
      const sizeConfig = acuitySizes[currentSizeIndex];
      const attemptKey = `${currentSizeIndex}_${acuityAttempts[currentSizeIndex] || 0}`;
      
      // Get or generate number for this size index and attempt
      let numberToUse = acuityNumbersRef.current[attemptKey];
      if (numberToUse === undefined) {
        numberToUse = generateRandomNumber(1, 9);
        acuityNumbersRef.current[attemptKey] = numberToUse;
      }
      
      setCurrentNumber(numberToUse);
      const signal = generateAcuitySignal(sizeConfig, numberToUse);
      setCurrentSignal(signal);
      timer.restart();
    }
  }, [phase, currentSizeIndex, generateAcuitySignal, acuityAttempts]);
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!currentSignal || isWaiting) return;
    
    timer.stop();
    const reactionTime = timer.time;
    const userAnswer = parseInt(userInput);
    const isCorrect = userAnswer === currentSignal.correctAnswer;
    
    setIsWaiting(true);
    
    if (phase === 'color') {
      const result = {
        patternId: currentSignal.id,
        userAnswer,
        correctAnswer: currentSignal.correctAnswer,
        isCorrect,
        reactionTime,
        type: currentSignal.type
      };
      
      setResults(prev => ({
        ...prev,
        colorBlindness: [...prev.colorBlindness, result]
      }));
      
      setFeedback(isCorrect ? 'SIGNAL CONFIRMED' : 'SIGNAL MISMATCH');
      
      setTimeout(() => {
        if (currentPatternIndex < colorBlindnessPatterns.length - 1) {
          setCurrentPatternIndex(prev => prev + 1);
          setUserInput('');
          setFeedback('');
          setIsWaiting(false);
        } else {
          // Move to acuity test
          setPhase('acuity');
          setUserInput('');
          setFeedback('');
          setIsWaiting(false);
          setCurrentNumber(null); // Reset for acuity phase
          acuityNumbersRef.current = {}; // Clear stored numbers
          setAcuityAttempts({}); // Clear attempt tracking
        }
      }, 1500);
      
    } else if (phase === 'acuity') {
      const currentAttempt = acuityAttempts[currentSizeIndex] || 0;
      const result = {
        sizeId: currentSignal.id,
        userAnswer,
        correctAnswer: currentSignal.correctAnswer,
        isCorrect,
        reactionTime,
        size: currentSignal.size,
        label: currentSignal.label,
        attempt: currentAttempt + 1
      };
      
      setResults(prev => ({
        ...prev,
        acuity: [...prev.acuity, result]
      }));
      
      if (isCorrect) {
        setFeedback('SIGNAL CONFIRMED');
        setTimeout(() => {
          if (currentSizeIndex < acuitySizes.length - 1) {
            // Continue with smaller size
            setCurrentSizeIndex(prev => prev + 1);
            setUserInput('');
            setFeedback('');
            setIsWaiting(false);
          } else {
            // Test complete - reached smallest size
            completeTest();
          }
        }, 1500);
      } else {
        // Incorrect answer
        if (currentAttempt === 0) {
          // First attempt failed - give second chance
          setFeedback('SIGNAL UNCLEAR - TRYING DIFFERENT SIGNAL');
          setTimeout(() => {
            setAcuityAttempts(prev => ({
              ...prev,
              [currentSizeIndex]: 1
            }));
            setUserInput('');
            setFeedback('');
            setIsWaiting(false);
          }, 1500);
        } else {
          // Second attempt failed - end test
          setFeedback('VISUAL ACUITY LIMIT REACHED');
          setTimeout(() => {
            completeTest();
          }, 2000);
        }
      }
    }
  }, [currentSignal, userInput, timer, phase, currentPatternIndex, currentSizeIndex, isWaiting]);
  
  const completeTest = useCallback(() => {
    // Find smallest correctly identified size
    const correctAcuityResults = results.acuity.filter(r => r.isCorrect);
    const smallestCorrectSize = correctAcuityResults.length > 0 
      ? Math.min(...correctAcuityResults.map(r => r.size))
      : acuitySizes[0].size;
    
    const signalData = {
      colorBlindnessResults: results.colorBlindness,
      acuityResults: results.acuity,
      smallestCorrectSize
    };
    
    gameState.updateGameData('signalRecognition', signalData);
    onComplete();
  }, [results, gameState, onComplete]);
  
  const renderSignal = () => {
    if (!currentSignal) return null;
    
    return (
      <Stage width={400} height={300}>
        <Layer>
          <Circle
            x={currentSignal.x}
            y={currentSignal.y}
            radius={currentSignal.size / 2}
            fill={currentSignal.colors[0]}
            stroke={currentSignal.colors[1] || currentSignal.colors[0]}
            strokeWidth={3}
            shadowColor="rgba(0, 245, 255, 0.5)"
            shadowBlur={10}
          />
          <Text
            x={currentSignal.x}
            y={currentSignal.y}
            text={currentSignal.number.toString()}
            fontSize={currentSignal.size * 0.5}
            fontFamily="Orbitron"
            fill="white"
            align="center"
            verticalAlign="middle"
            offsetX={currentSignal.size * 0.25}
            offsetY={currentSignal.size * 0.25}
            width={currentSignal.size * 0.5}
            height={currentSignal.size * 0.5}
            fontStyle="bold"
            listening={false}
          />
        </Layer>
      </Stage>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-cyber text-cyber-blue mb-2">
            SIGNAL RECOGNITION PROTOCOL
          </h2>
          <p className="text-cyber-green">
            {phase === 'color' ? 'COLOR-CODED PRIORITY SIGNALS' : 'SIGNAL STRENGTH ANALYSIS'}
          </p>
          <div className="text-sm text-gray-400 mt-2">
            {phase === 'color' 
              ? `Pattern ${currentPatternIndex + 1} of ${colorBlindnessPatterns.length}`
              : `Acuity Level ${currentSizeIndex + 1} ${(acuityAttempts[currentSizeIndex] || 0) > 0 ? '(Attempt 2)' : ''}`
            }
          </div>
        </div>
        
        {/* Signal Display */}
        <div className="cyber-panel p-8 mb-6">
          <div className="flex justify-center mb-6">
            {renderSignal()}
          </div>
          
          {feedback && (
            <div className={`text-center text-lg font-cyber mb-4 ${
              feedback.includes('CONFIRMED') ? 'text-cyber-green' : 'text-cyber-red'
            }`}>
              {feedback}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="text-center">
            <div className="mb-4">
              <label className="block text-sm font-cyber text-gray-300 mb-2">
                IDENTIFY SIGNAL NUMBER
              </label>
              <input
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="cyber-input w-32 text-center text-xl"
                min="0"
                max="9"
                disabled={isWaiting}
                autoFocus
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isWaiting || !userInput}
              className="cyber-button px-8"
            >
              {isWaiting ? 'PROCESSING...' : 'CONFIRM SIGNAL'}
            </button>
          </form>
        </div>
        
        {/* Progress */}
        <div className="cyber-panel p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">
              Phase: {phase === 'color' ? 'Color Recognition' : 'Acuity Test'}
            </span>
            <span className="text-cyber-blue font-mono">
              Time: {timer.formattedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalRecognition;
