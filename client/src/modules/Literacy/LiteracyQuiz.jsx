import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ProgressBar from '../../components/ProgressBar';
import useStore from '../../state/store';
import useInteractionTracking from '../../hooks/useInteractionTracking';
import {
  LITERACY_QUESTIONS,
  calculateLiteracyScore,
  calculateCategoryScores,
} from '../../utils/literacyQuestions';
import { saveLiteracyResults } from '../../utils/api';

const LiteracyQuiz = () => {
  const navigate = useNavigate();
  const sessionId = useStore((state) => state.sessionId);
  const { recordLiteracyResponse, completeLiteracyTest, completeModule } = useStore();
  const { trackEvent, trackClick, trackHover, trackFocus } = useInteractionTracking('literacy', true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [focusShiftCount, setFocusShiftCount] = useState(0);
  const [hoverEvents, setHoverEvents] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState(null);

  const hoverTimerRef = useRef({});

  const currentQuestion = LITERACY_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === LITERACY_QUESTIONS.length - 1;
  const totalQuestions = LITERACY_QUESTIONS.length;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setFocusShiftCount(0);
    setHoverEvents([]);
    trackEvent('question_shown', {
      metadata: {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
      },
    });
  }, [currentQuestionIndex, currentQuestion, trackEvent]);

  const handleOptionClick = (option, event) => {
    setSelectedAnswer(option);
    trackClick(event, {
      metadata: { questionId: currentQuestion.id, selectedOption: option },
    });
  };

  const handleOptionHover = (option, isEntering) => {
    if (isEntering) {
      hoverTimerRef.current[option] = Date.now();
    } else {
      if (hoverTimerRef.current[option]) {
        const duration = Date.now() - hoverTimerRef.current[option];
        setHoverEvents((prev) => [
          ...prev,
          { option, duration, timestamp: Date.now() },
        ]);
        trackHover(new MouseEvent('hover'), {
          metadata: {
            questionId: currentQuestion.id,
            option,
            duration,
          },
        });
      }
    }
  };

  const handleFocus = (event) => {
    setFocusShiftCount((prev) => prev + 1);
    trackFocus(event, {
      metadata: { questionId: currentQuestion.id, count: focusShiftCount + 1 },
    });
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    const responseTime = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const responseData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      responseTime,
      focusShifts: focusShiftCount,
      hoverEvents,
    };

    recordLiteracyResponse(responseData);
    trackEvent('question_submitted', {
      metadata: {
        ...responseData,
        category: currentQuestion.category,
      },
    });

    if (isLastQuestion) {
      // Complete the quiz
      await completeQuiz();
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    }
  };

  const completeQuiz = async () => {
    completeLiteracyTest();
    
    const allResponses = useStore.getState().literacyResults.responses;
    const score = calculateLiteracyScore(allResponses);
    const categoryScores = calculateCategoryScores(allResponses);

    const totalTime = allResponses.reduce((sum, r) => sum + r.responseTime, 0);
    const totalFocusShifts = allResponses.reduce((sum, r) => sum + r.focusShifts, 0);
    const totalHoverEvents = allResponses.reduce(
      (sum, r) => sum + r.hoverEvents.length,
      0
    );

    const resultsData = {
      sessionId,
      responses: allResponses,
      score,
      metrics: {
        totalTime,
        averageResponseTime: Math.round(totalTime / allResponses.length),
        totalFocusShifts,
        totalHoverEvents,
      },
      categoryScores,
    };

    setResults(resultsData);

    // Save to backend
    try {
      await saveLiteracyResults(resultsData);
      
      // Mark module as completed
      await completeModule('knowledge');
    } catch (error) {
      console.error('Failed to save results:', error);
    }

    setIsComplete(true);
  };

  if (isComplete && results) {
    return (
      <Layout title="Computer Literacy Quiz Complete" subtitle="Knowledge Console">
        <div className="max-w-3xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-3xl font-bold mb-6">Quiz Complete!</h3>

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-cyber-blue-500 to-cyber-purple-500 p-6 rounded-lg mb-6">
              <div className="text-sm text-white/80 mb-2">Computer Literacy Score (CLS)</div>
              <div className="text-6xl font-bold text-white">
                {results.score.computerLiteracyScore.toFixed(1)}
              </div>
              <div className="text-white/80 mt-2">
                {results.score.correctAnswers} / {results.score.totalQuestions} Correct
                ({results.score.percentage}%)
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-4 text-left">Category Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                {results.categoryScores.map((cat) => (
                  <div key={cat.category} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 capitalize mb-1">
                      {cat.category}
                    </div>
                    <div className="text-2xl font-bold text-cyber-blue-400">
                      {cat.percentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {cat.correct}/{cat.total} correct
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
              <h4 className="text-lg font-bold mb-3 text-left">Performance Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-400">Avg Response Time</div>
                  <div className="text-lg font-semibold">
                    {(results.metrics.averageResponseTime / 1000).toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Focus Shifts</div>
                  <div className="text-lg font-semibold">
                    {results.metrics.totalFocusShifts}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Hover Events</div>
                  <div className="text-lg font-semibold">
                    {results.metrics.totalHoverEvents}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Factor Explanation */}
            <div className="bg-cyan-900/30 border border-cyan-500/30 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-300">
                <strong>Score Calculation:</strong> Your CLS is calculated based on correct
                answers plus a time factor. Consistent, thoughtful responses are rewarded.
              </p>
            </div>

            <button
              onClick={() => navigate('/complete')}
              className="btn-primary w-full"
            >
              Finish Assessment
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Computer Literacy Quiz" subtitle="Knowledge Console">
      <div className="max-w-3xl mx-auto">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={totalQuestions}
          label="Question Progress"
        />

        <div className="card">
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-cyber-blue-500/30 rounded-full text-sm font-semibold capitalize">
                {currentQuestion.category}
              </span>
              <span className="text-sm text-gray-400">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <h3 className="text-2xl font-bold">{currentQuestion.question}</h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={(e) => handleOptionClick(option, e)}
                onFocus={handleFocus}
                onMouseEnter={() => handleOptionHover(option, true)}
                onMouseLeave={() => handleOptionHover(option, false)}
                className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                  selectedAnswer === option
                    ? 'bg-cyber-blue-500 border-2 border-cyber-blue-400 shadow-lg'
                    : 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswer === option
                        ? 'border-white bg-white'
                        : 'border-gray-400'
                    }`}
                  >
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-cyber-blue-500"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="btn-primary w-full"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question →'}
          </button>
        </div>

        {/* Instructions */}
        <div className="card mt-6 bg-cyber-blue-900/20 border-cyber-blue-500/50">
          <h4 className="font-bold mb-2">💡 Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Select the best answer for each question</li>
            <li>• Take your time to read each option carefully</li>
            <li>• Your response time and interactions are tracked</li>
            <li>• Questions cover icons, terminology, navigation, and security</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default LiteracyQuiz;

