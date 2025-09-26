import React, { useState, useEffect, useCallback } from 'react';
import { literacyQuestions } from '../utils/gameData';
import { useTimer } from '../hooks/useGameState';

const LiteracyQuiz = ({ onComplete, gameState }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  
  const timer = useTimer();
  
  const currentQuestion = literacyQuestions[currentQuestionIndex];
  
  useEffect(() => {
    timer.start();
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);
  
  const handleAnswerSelect = useCallback((optionId) => {
    if (showFeedback) return;
    setSelectedAnswer(optionId);
  }, [showFeedback]);
  
  const handleSubmit = useCallback(() => {
    if (!selectedAnswer || showFeedback) return;
    
    const questionTime = Date.now() - questionStartTime;
    const selectedOption = currentQuestion.options.find(opt => opt.id === selectedAnswer);
    const isCorrect = selectedOption?.correct || false;
    
    const answerData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      selectedAnswer: selectedAnswer,
      selectedText: selectedOption?.text || selectedOption?.icon || '',
      isCorrect,
      correctAnswer: currentQuestion.options.find(opt => opt.correct)?.id || '',
      timeSpent: questionTime
    };
    
    setAnswers(prev => [...prev, answerData]);
    setShowFeedback(true);
    
    // Show feedback for 2 seconds, then move to next question
    setTimeout(() => {
      if (currentQuestionIndex < literacyQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
        setQuestionStartTime(Date.now());
      } else {
        completeQuiz();
      }
    }, 2000);
  }, [selectedAnswer, showFeedback, currentQuestion, currentQuestionIndex, questionStartTime]);
  
  const completeQuiz = useCallback(() => {
    timer.stop();
    
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const totalTime = answers.reduce((sum, answer) => sum + answer.timeSpent, 0);
    
    const quizData = {
      answers: answers,
      totalQuestions: literacyQuestions.length,
      correctAnswers: correctAnswers,
      timeSpent: totalTime
    };
    
    gameState.updateGameData('literacyQuiz', quizData);
    setQuizComplete(true);
    
    // Complete after showing final stats
    setTimeout(() => {
      onComplete('literacy', quizData);
    }, 3000);
  }, [answers, timer, gameState, onComplete]);
  
  if (quizComplete) {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const accuracy = Math.round((correctAnswers / literacyQuestions.length) * 100);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-3xl font-cyber text-cyber-green mb-8">
            SYSTEM ACCESS VERIFIED
          </h2>
          
          <div className="cyber-panel p-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-3xl font-cyber text-cyber-blue">
                  {correctAnswers}/{literacyQuestions.length}
                </div>
                <div className="text-gray-400">Correct Answers</div>
              </div>
              
              <div>
                <div className="text-3xl font-cyber text-cyber-purple">
                  {accuracy}%
                </div>
                <div className="text-gray-400">Accuracy</div>
              </div>
            </div>
            
            <div className="text-lg font-cyber text-cyber-green">
              {accuracy >= 80 ? 'EXCELLENT SYSTEM KNOWLEDGE' :
               accuracy >= 60 ? 'ADEQUATE SYSTEM KNOWLEDGE' :
               'ADDITIONAL TRAINING RECOMMENDED'}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-cyber text-cyber-purple mb-2">
            SYSTEM ACCESS VERIFICATION
          </h2>
          <p className="text-cyber-blue">
            INTERFACE KNOWLEDGE ASSESSMENT
          </p>
          <div className="text-sm text-gray-400 mt-2">
            Question {currentQuestionIndex + 1} of {literacyQuestions.length}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="cyber-panel p-2 mb-6">
          <div className="bg-dark-border rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyber-blue to-cyber-purple h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / literacyQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question */}
        <div className="cyber-panel p-8 mb-6">
          <h3 className="text-xl font-cyber text-cyber-green mb-8 text-center">
            {currentQuestion.question}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => {
              let className = "quiz-option";
              
              if (showFeedback) {
                if (option.id === selectedAnswer) {
                  className += option.correct ? " correct" : " incorrect";
                } else if (option.correct) {
                  className += " correct";
                }
              } else if (option.id === selectedAnswer) {
                className += " selected";
              }
              
              return (
                <div
                  key={option.id}
                  className={className}
                  onClick={() => handleAnswerSelect(option.id)}
                >
                  <div className="text-center">
                    {option.icon && (
                      <div className="text-4xl mb-3">{option.icon}</div>
                    )}
                    <div className="font-cyber text-lg">
                      {option.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {showFeedback && (
            <div className="mt-6 text-center">
              <div className={`text-lg font-cyber ${
                currentQuestion.options.find(opt => opt.id === selectedAnswer)?.correct 
                  ? 'text-cyber-green' 
                  : 'text-cyber-red'
              }`}>
                {currentQuestion.options.find(opt => opt.id === selectedAnswer)?.correct 
                  ? 'CORRECT - ACCESS GRANTED' 
                  : 'INCORRECT - ACCESS DENIED'}
              </div>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        {!showFeedback && (
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className={`cyber-button px-8 py-3 ${!selectedAnswer ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              SUBMIT RESPONSE
            </button>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="cyber-panel p-4 text-center">
            <div className="text-lg font-cyber text-cyber-blue">
              {answers.filter(a => a.isCorrect).length}
            </div>
            <div className="text-sm text-gray-400">CORRECT</div>
          </div>
          
          <div className="cyber-panel p-4 text-center">
            <div className="text-lg font-cyber text-cyber-yellow">
              {answers.length}
            </div>
            <div className="text-sm text-gray-400">ANSWERED</div>
          </div>
          
          <div className="cyber-panel p-4 text-center">
            <div className="text-lg font-cyber text-cyber-purple">
              {timer.formattedTime}
            </div>
            <div className="text-sm text-gray-400">TIME</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiteracyQuiz;
