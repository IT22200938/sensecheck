import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ProgressBar from '../../components/ProgressBar';
import useStore from '../../state/store';
import useInteractionTracking from '../../hooks/useInteractionTracking';
import { ISHIHARA_PLATES, analyzeColorBlindness } from '../../utils/colorBlindnessAnalysis';
import { saveVisionResults } from '../../utils/api';

// Import Ishihara plate images
import ishihara1 from '../../resources/ishihara_1.jpg';
import ishihara3 from '../../resources/ishihara_3.jpg';
import ishihara11 from '../../resources/ishihara_11.jpg';
import ishihara19 from '../../resources/ishihara_19.jpg';

// Map image names to imports
const imageMap = {
  'ishihara_1.jpg': ishihara1,
  'ishihara_3.jpg': ishihara3,
  'ishihara_11.jpg': ishihara11,
  'ishihara_19.jpg': ishihara19,
};

const ColorBlindnessTest = () => {
  const navigate = useNavigate();
  const sessionId = useStore((state) => state.sessionId);
  const { recordColorBlindnessResponse, completeColorBlindnessTest } = useStore();
  const { trackEvent, trackClick, trackFocus } = useInteractionTracking('colorBlindness', true);
  
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [plateStartTime, setPlateStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState(null);

  const currentPlate = ISHIHARA_PLATES[currentPlateIndex];
  const isLastPlate = currentPlateIndex === ISHIHARA_PLATES.length - 1;

  useEffect(() => {
    trackEvent('plate_shown', {
      metadata: { plateId: currentPlate?.plateId, imageName: currentPlate?.imageName },
    });
    setPlateStartTime(Date.now());
  }, [currentPlateIndex, trackEvent, currentPlate]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserAnswer(value);
    trackEvent('input_change', {
      target: { id: 'answer-input', value: value.substring(0, 10) },
    });
  };

  const handleNothingClick = () => {
    setUserAnswer('nothing');
    trackClick(new MouseEvent('click'), { customAction: 'nothing_selected' });
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    const responseTime = Date.now() - plateStartTime;
    const plateData = {
      plateId: currentPlate.plateId,
      imageName: currentPlate.imageName,
      userAnswer: userAnswer.trim(),
      responseTime,
    };

    recordColorBlindnessResponse(plateData);
    trackEvent('plate_submitted', {
      metadata: { ...plateData },
    });

    if (isLastPlate) {
      // Complete the test
      completeColorBlindnessTest();
      const allPlates = useStore.getState().colorBlindnessResults.plates;
      
      const analysis = analyzeColorBlindness(allPlates);
      setResults(analysis);
      
      // Save to backend
      try {
        await saveVisionResults({
          sessionId,
          colorBlindness: {
            plates: allPlates,
            ...analysis,
          },
        });
      } catch (error) {
        console.error('Failed to save results:', error);
      }
      
      setIsComplete(true);
    } else {
      // Move to next plate
      setCurrentPlateIndex(currentPlateIndex + 1);
      setUserAnswer('');
    }
  };

  const handleContinue = () => {
    navigate('/perception/visual-acuity');
  };

  if (isComplete && results) {
    return (
      <Layout title="Color Blindness Test Complete" subtitle="Perception Lab">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-3xl font-bold mb-6">Test Complete!</h3>
            
            <div className="space-y-4 text-left">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Color Vision Score</div>
                <div className="text-3xl font-bold text-cyber-blue-400">
                  {results.colorVisionScore}%
                </div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Diagnosis</div>
                <div className="text-xl font-semibold">
                  {results.diagnosis}
                </div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Average Response Time</div>
                <div className="text-lg">
                  {(results.averageResponseTime / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="btn-primary w-full mt-8"
            >
              Continue to Visual Acuity Test →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Color Blindness Test" subtitle="Perception Lab • Chamber 1">
      <div className="max-w-3xl mx-auto">
        <ProgressBar
          current={currentPlateIndex + 1}
          total={ISHIHARA_PLATES.length}
          label="Plate Progress"
        />

        <div className="card">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">
              Plate {currentPlateIndex + 1} of {ISHIHARA_PLATES.length}
            </h3>
            <p className="text-gray-400">
              What number do you see in the image below?
            </p>
          </div>

          {/* Image Container */}
          <div className="bg-gray-900 rounded-lg p-8 mb-6 flex justify-center items-center min-h-[400px]">
            <div className="relative">
              {/* Ishihara plate image */}
              <img
                src={imageMap[currentPlate.imageName]}
                alt={`Ishihara Plate ${currentPlate.plateId}`}
                className="w-80 h-80 rounded-full object-cover shadow-2xl"
                onError={(e) => {
                  // Fallback to placeholder if image not found
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              {/* Fallback placeholder (hidden by default) */}
              <div 
                className="w-80 h-80 rounded-full bg-gradient-to-br from-red-300 via-green-300 to-yellow-300 items-center justify-center"
                style={{ display: 'none' }}
              >
                <div className="text-white text-6xl font-bold opacity-50">
                  {currentPlate.plateId}
                </div>
                <p className="text-white text-sm mt-2 opacity-70">
                  Image not found
                </p>
              </div>
              <p className="text-center text-gray-400 mt-4 text-sm">
                Plate {currentPlate.plateId}/4
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="answer-input" className="block text-sm font-semibold mb-2">
                Enter the number you see:
              </label>
              <input
                id="answer-input"
                type="text"
                value={userAnswer}
                onChange={handleInputChange}
                onFocus={(e) => trackFocus(e)}
                className="input-field text-center text-2xl"
                placeholder="Type number or click 'Nothing'"
                autoFocus
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleNothingClick}
                className="btn-secondary flex-1"
              >
                I See Nothing
              </button>
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className="btn-primary flex-1"
              >
                {isLastPlate ? 'Finish Test' : 'Next Plate'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="card mt-6 bg-cyber-blue-900/20 border-cyber-blue-500/50">
          <h4 className="font-bold mb-2">💡 Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Look at the image and identify any number you can see</li>
            <li>• If you cannot see any number, click &quot;I See Nothing&quot;</li>
            <li>• Take your time - accuracy is important</li>
            <li>• Ensure your screen brightness is adequate</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ColorBlindnessTest;

