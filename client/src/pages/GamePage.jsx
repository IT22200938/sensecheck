import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignalRecognition from '../components/SignalRecognition';
import BubbleGame from '../components/BubbleGame';
import LiteracyQuiz from '../components/LiteracyQuiz';
import { saveGameResults } from '../utils/api';

const GamePage = ({ gameState }) => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState('signal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Redirect if no user
  useEffect(() => {
    if (!gameState.currentUser) {
      navigate('/');
    }
  }, [gameState.currentUser, navigate]);
  
  const handlePhaseComplete = async (phase, data = null) => {
    switch (phase) {
      case 'signal':
        setCurrentPhase('bubble');
        break;
      case 'bubble':
        setCurrentPhase('literacy');
        break;
      case 'literacy':
        await completeGame(data);
        break;
      default:
        break;
    }
  };
  
  const completeGame = async (literacyData = null) => {
    setLoading(true);
    setError('');
    
    // If literacy data is provided, use it to ensure we have the latest data
    const finalGameData = literacyData ? {
      ...gameState.gameData,
      literacyQuiz: literacyData
    } : gameState.gameData;
    
    
    try {
      const response = await saveGameResults(
        gameState.currentUser.userId,
        finalGameData
      );
      
      if (response.success) {
        await gameState.setGameResults(response.data);
        navigate('/results');
      } else {
        throw new Error(response.message || 'Failed to save results');
      }
    } catch (err) {
      console.error('Error saving game results:', err);
      setError('Failed to save game results. Please try again.');
      setLoading(false);
    }
  };
  
  if (!gameState.currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-cyber-red text-xl font-cyber mb-4">
            ACCESS DENIED
          </div>
          <p className="text-gray-400">Please complete operator registration first.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-cyber-blue text-2xl font-cyber mb-4 animate-pulse-glow">
            PROCESSING ASSESSMENT DATA...
          </div>
          <div className="text-gray-400">Calculating operator certification...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="cyber-panel p-8 max-w-md">
          <div className="text-cyber-red text-xl font-cyber mb-4 text-center">
            SYSTEM ERROR
          </div>
          <p className="text-gray-300 mb-6 text-center">{error}</p>
          <div className="text-center">
            <button
              onClick={() => setError('')}
              className="cyber-button"
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      {/* Mission Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/90 backdrop-blur-sm border-b border-dark-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-cyber-green font-cyber">
                OPERATOR: {gameState.currentUser?.name}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-cyber-blue font-mono">
                PHASE: {currentPhase.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                currentPhase === 'signal' ? 'bg-cyber-blue animate-pulse' : 
                'bg-gray-600'
              }`}></div>
              <div className={`w-2 h-2 rounded-full ${
                currentPhase === 'bubble' ? 'bg-cyber-yellow animate-pulse' : 
                currentPhase === 'literacy' ? 'bg-gray-400' : 'bg-gray-600'
              }`}></div>
              <div className={`w-2 h-2 rounded-full ${
                currentPhase === 'literacy' ? 'bg-cyber-purple animate-pulse' : 
                'bg-gray-600'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Content */}
      <div className="pt-16">
        {currentPhase === 'signal' && (
          <SignalRecognition
            onComplete={() => handlePhaseComplete('signal')}
            gameState={gameState}
          />
        )}
        
        {currentPhase === 'bubble' && (
          <BubbleGame
            onComplete={() => handlePhaseComplete('bubble')}
            gameState={gameState}
          />
        )}
        
        {currentPhase === 'literacy' && (
          <LiteracyQuiz
            onComplete={(phase, data) => handlePhaseComplete(phase, data)}
            gameState={gameState}
          />
        )}
      </div>
      
      {/* Emergency Exit */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => navigate('/')}
          className="bg-cyber-red/20 border border-cyber-red text-cyber-red px-4 py-2 rounded font-cyber text-sm hover:bg-cyber-red/30 transition-colors"
        >
          ABORT MISSION
        </button>
      </div>
    </div>
  );
};

export default GamePage;
