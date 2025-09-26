import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useGameState } from './hooks/useGameState';
import IntroPage from './pages/IntroPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

function App() {
  const gameState = useGameState();
  
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-white">
        {/* Futuristic background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 via-transparent to-cyber-purple/5"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-purple to-transparent opacity-50"></div>
        </div>
        
        <Routes>
          <Route path="/" element={<IntroPage gameState={gameState} />} />
          <Route path="/game" element={<GamePage gameState={gameState} />} />
          <Route path="/results" element={<ResultsPage gameState={gameState} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
