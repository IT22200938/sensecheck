import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import useStore from '../../state/store';
import useInteractionTracking from '../../hooks/useInteractionTracking';
import { calculateVisualAcuityMetrics } from '../../utils/visualAcuityCalculations';
import { saveVisionResults } from '../../utils/api';

const VisualAcuityTest = () => {
  const navigate = useNavigate();
  const sessionId = useStore((state) => state.sessionId);
  const {
    recordVisualAcuityAttempt,
    setVisualAcuitySize,
    completeVisualAcuityTest,
    completeModule,
  } = useStore();
  const { trackEvent, trackClick } = useInteractionTracking('visualAcuity', true);

  const [currentSize, setCurrentSize] = useState(80);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [attemptStartTime, setAttemptStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [lastCorrectSize, setLastCorrectSize] = useState(80);

  // Generate random number for display
  const generateNumber = () => {
    return Math.floor(Math.random() * 90) + 10; // 10-99
  };

  useEffect(() => {
    const number = generateNumber();
    setCurrentNumber(number);
    setAttemptStartTime(Date.now());
    trackEvent('number_shown', {
      metadata: { number, size: currentSize, attempt: attemptNumber },
    });
  }, [currentSize, attemptNumber, trackEvent]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    const responseTime = Date.now() - attemptStartTime;
    const isCorrect = parseInt(userAnswer) === currentNumber;

    const attemptData = {
      size: currentSize,
      number: currentNumber,
      userAnswer: parseInt(userAnswer),
      isCorrect,
      responseTime,
      attemptNumber,
    };

    recordVisualAcuityAttempt(attemptData);
    trackEvent('attempt_submitted', { metadata: attemptData });

    if (isCorrect) {
      // Correct answer - reduce size
      setLastCorrectSize(currentSize);
      const newSize = currentSize - 10;
      
      if (newSize < 20) {
        // Test complete - reached minimum size
        await completeTest();
      } else {
        setCurrentSize(newSize);
        setVisualAcuitySize(newSize);
        setUserAnswer('');
        setAttemptNumber(1);
      }
    } else {
      // Incorrect answer
      if (attemptNumber === 1) {
        // First attempt failed - allow one retry
        setUserAnswer('');
        setAttemptNumber(2);
      } else {
        // Second attempt failed - test complete
        await completeTest();
      }
    }
  };

  const completeTest = async () => {
    completeVisualAcuityTest();
    
    const allAttempts = useStore.getState().visualAcuityResults.attempts;
    const metrics = calculateVisualAcuityMetrics(lastCorrectSize);
    
    const resultsData = {
      attempts: allAttempts,
      finalResolvedSize: lastCorrectSize,
      ...metrics,
    };

    setFinalResults(resultsData);

    // Save to backend
    try {
      await saveVisionResults({
        sessionId,
        visualAcuity: resultsData,
      });
      
      // Mark module as completed
      await completeModule('perception');
    } catch (error) {
      console.error('Failed to save results:', error);
    }

    setIsComplete(true);
  };

  const handleContinue = () => {
    navigate('/');
  };

  if (isComplete && finalResults) {
    return (
      <Layout title="Visual Acuity Test Complete" subtitle="Perception Lab">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-3xl font-bold mb-6">Test Complete!</h3>
            
            <div className="space-y-4 text-left">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Snellen Visual Acuity</div>
                <div className="text-4xl font-bold text-cyber-blue-400">
                  {finalResults.snellenEstimate}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Smallest Size Resolved</div>
                  <div className="text-xl font-semibold">{finalResults.finalResolvedSize}px</div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Visual Angle</div>
                  <div className="text-xl font-semibold">{finalResults.visualAngle}°</div>
                </div>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Minimum Angle of Resolution (MAR)</div>
                <div className="text-lg">{finalResults.mar} arc minutes</div>
              </div>
              
              <div className="bg-cyan-900/30 border border-cyan-500/30 p-4 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Note:</strong> These results are estimates based on your screen size and
                  assumed viewing distance. For clinical diagnosis, please consult an eye care professional.
                </p>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="btn-primary w-full mt-8"
            >
              Return to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Visual Acuity Test" subtitle="Perception Lab • Chamber 2">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            {/* <h3 className="text-2xl font-bold mb-2">
              Current Size: {currentSize}px
            </h3> */}
            <h3 className="text-xl font-bold text-gray-400">
              {attemptNumber === 1 
                ? 'What number do you see in the circle below?' 
                : 'Incorrect! Try again (Last chance)'}
            </h3>
          </div>

          {/* Number Display */}
          <div className="bg-gray-900 rounded-lg p-8 mb-6 flex justify-center items-center min-h-[500px]">
            <div
              className="rounded-full bg-white flex items-center justify-center font-bold text-gray-900 shadow-2xl"
              style={{
                width: `${currentSize}px`,
                height: `${currentSize}px`,
                fontSize: `${currentSize * 0.5}px`,
              }}
            >
              {currentNumber}
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="number-input" className="block text-sm font-semibold mb-2">
                Enter the number you see:
              </label>
              <input
                id="number-input"
                type="number"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  trackEvent('input_change', { target: { value: e.target.value } });
                }}
                className="input-field text-center text-2xl"
                placeholder="Enter number"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
            </div>

            <button
              onClick={(e) => {
                trackClick(e);
                handleSubmit();
              }}
              disabled={!userAnswer.trim()}
              className="btn-primary w-full"
            >
              Submit Answer
            </button>
          </div>

          {/* Attempt Indicator */}
          {attemptNumber === 2 && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-center">
              <span className="text-yellow-300 font-semibold">
                ⚠️ Second Attempt - Answer carefully
              </span>
            </div>
          )}
        </div>

        {/* Instructions Card */}
        <div className="card mt-6 bg-cyber-blue-900/20 border-cyber-blue-500/50">
          <h4 className="font-bold mb-2">💡 Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Keep a one meter distance from the screen</li>
            <li>• Identify the number displayed in the white circle</li>
            <li>• The number will get smaller with each correct answer</li>
            <li>• You get two retries if you answer incorrectly</li>
            <li>• The test ends when you can no longer see the number clearly</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default VisualAcuityTest;

