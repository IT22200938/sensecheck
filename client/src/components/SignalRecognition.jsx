import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import { ishiharaPlates, acuitySizes, generateRandomNumber, generateRandomPosition } from '../utils/gameData';
import { useTimer } from '../hooks/useGameState';

const SignalRecognition = ({ onComplete, gameState }) => {
  const [phase, setPhase] = useState('color'); // 'color' or 'acuity'
  const [currentPlate, setCurrentPlate] = useState(null);
  const [currentSignal, setCurrentSignal] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [seeNothing, setSeeNothing] = useState(false);
  const [results, setResults] = useState({
    colorBlindness: [],
    acuity: []
  });
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(null);
  const acuityNumbersRef = useRef({}); // Store numbers for each size index
  const [acuityAttempts, setAcuityAttempts] = useState({}); // Track attempts per size
  
  const timer = useTimer();
  
  // Start color blindness test
  useEffect(() => {
    if (phase === 'color' && currentPlateIndex < ishiharaPlates.length) {
      const plate = ishiharaPlates[currentPlateIndex];
      setCurrentPlate(plate);
      timer.restart();
    }
  }, [phase, currentPlateIndex, timer]);
  
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
    if ((!currentPlate && !currentSignal) || isWaiting) return;
    
    timer.stop();
    const reactionTime = timer.time;
    
    setIsWaiting(true);
    
    if (phase === 'color') {
      // Handle Ishihara plate response
      const userAnswer = seeNothing ? null : parseInt(userInput);
      
      // Determine if response is correct based on plate type and user answer
      let isCorrect = false;
      let indicatesColorBlind = false;
      let indicatesNormal = false;
      
      if (currentPlate.type === 'control') {
        // Control plate - both should see the same number
        isCorrect = userAnswer === currentPlate.normalVision;
      } else if (currentPlate.type === 'red_green_test') {
        // Test plate logic based on what normal and color blind vision should see
        if (currentPlate.normalVision !== null && currentPlate.colorBlindVision === null) {
          // Normal sees number, color blind sees nothing (like plate 11)
          if (userAnswer === currentPlate.normalVision) {
            isCorrect = true;
            indicatesNormal = true;
          } else if (userAnswer === null || userAnswer !== currentPlate.normalVision) {
            isCorrect = true; // Consider it correct for color blind detection
            indicatesColorBlind = true;
          }
        } else if (currentPlate.normalVision === null && currentPlate.colorBlindVision !== null) {
          // Normal sees nothing, color blind sees number (like plate 19)
          if (userAnswer === null) {
            isCorrect = true;
            indicatesNormal = true;
          } else if (userAnswer === currentPlate.colorBlindVision || userAnswer !== null) {
            isCorrect = true; // Consider it correct for color blind detection
            indicatesColorBlind = true;
          }
        } else {
          // Both see different numbers (like plate 3)
          if (userAnswer === currentPlate.normalVision) {
            isCorrect = true;
            indicatesNormal = true;
          } else if (userAnswer === currentPlate.colorBlindVision) {
            isCorrect = true;
            indicatesColorBlind = true;
          }
        }
      }
      
      const result = {
        plateNumber: currentPlate.plateNumber,
        userAnswer,
        normalVision: currentPlate.normalVision,
        colorBlindVision: currentPlate.colorBlindVision,
        type: currentPlate.type,
        isCorrect,
        indicatesColorBlind,
        indicatesNormal,
        reactionTime
      };
      
      setResults(prev => ({
        ...prev,
        colorBlindness: [...prev.colorBlindness, result]
      }));
      
      setFeedback(isCorrect ? 'SIGNAL CONFIRMED' : 'SIGNAL RECORDED');
      
      setTimeout(() => {
        if (currentPlateIndex < ishiharaPlates.length - 1) {
          setCurrentPlateIndex(prev => prev + 1);
          setUserInput('');
          setSeeNothing(false);
          setFeedback('');
          setIsWaiting(false);
        } else {
          // Move to acuity test
          setPhase('acuity');
          setUserInput('');
          setSeeNothing(false);
          setFeedback('');
          setIsWaiting(false);
          setCurrentNumber(null);
          acuityNumbersRef.current = {};
          setAcuityAttempts({});
        }
      }, 1500);
      
    } else if (phase === 'acuity') {
      const userAnswer = parseInt(userInput);
      const isCorrect = userAnswer === currentSignal.correctAnswer;
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
  }, [currentPlate, currentSignal, userInput, seeNothing, timer, phase, currentPlateIndex, currentSizeIndex, isWaiting, acuityAttempts]);
  
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
  
  const renderTestContent = () => {
    if (phase === 'color' && currentPlate) {
      return (
        <div className="flex justify-center mb-6">
          <img 
            src={currentPlate.image} 
            alt={`Ishihara Plate ${currentPlate.plateNumber}`}
            className="max-w-sm max-h-80 rounded-lg border-2 border-cyber-blue"
            style={{ filter: 'brightness(1.1) contrast(1.1)' }}
          />
        </div>
      );
    } else if (phase === 'acuity' && currentSignal) {
      return (
        <div className="flex justify-center mb-6">
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
        </div>
      );
    }
    return null;
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
              ? `Plate ${currentPlateIndex + 1} of ${ishiharaPlates.length}`
              : `Acuity Level ${currentSizeIndex + 1} ${(acuityAttempts[currentSizeIndex] || 0) > 0 ? '(Attempt 2)' : ''}`
            }
          </div>
        </div>
        
        {/* Signal Display */}
        <div className="cyber-panel p-8 mb-6">
          {renderTestContent()}
          
          {feedback && (
            <div className={`text-center text-lg font-cyber mb-4 ${
              feedback.includes('CONFIRMED') || feedback.includes('RECORDED') ? 'text-cyber-green' : 'text-cyber-red'
            }`}>
              {feedback}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="text-center">
            {phase === 'color' && (
              <div className="mb-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seeNothing}
                      onChange={(e) => {
                        setSeeNothing(e.target.checked);
                        if (e.target.checked) {
                          setUserInput('');
                        }
                      }}
                      className="mr-2 w-4 h-4 text-cyber-blue bg-dark-bg border-cyber-blue rounded focus:ring-cyber-blue"
                      disabled={isWaiting}
                    />
                    <span className="text-sm font-cyber text-cyber-yellow">
                      I SEE NOTHING / NO NUMBER
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-cyber text-gray-300 mb-2">
                {phase === 'color' ? 'IDENTIFY NUMBER IN PLATE' : 'IDENTIFY SIGNAL NUMBER'}
              </label>
              <input
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="cyber-input w-32 text-center text-xl"
                min="0"
                max="12"
                disabled={isWaiting || seeNothing}
                autoFocus={!seeNothing}
                required={!seeNothing}
                placeholder={seeNothing ? "Nothing" : "Enter number"}
              />
            </div>
            
            <button
              type="submit"
              disabled={isWaiting || (!userInput && !seeNothing)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalRecognition;
