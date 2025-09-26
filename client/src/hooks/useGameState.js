import { useState, useCallback, useRef } from 'react';

export const useGameState = () => {
  const [gamePhase, setGamePhase] = useState('intro'); // intro, signal, bubble, literacy, results
  const [gameData, setGameData] = useState({
    user: null,
    signalRecognition: {
      colorBlindnessResults: [],
      acuityResults: [],
      smallestCorrectSize: null
    },
    bubbleGame: {
      rounds: [],
      totalBubbles: 0,
      poppedBubbles: 0
    },
    literacyQuiz: {
      answers: [],
      totalQuestions: 0,
      correctAnswers: 0,
      timeSpent: 0
    }
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [gameResults, setGameResults] = useState(null);
  
  const updateGameData = useCallback((phase, data) => {
    setGameData(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        ...data
      }
    }));
  }, []);
  
  const nextPhase = useCallback(() => {
    const phases = ['intro', 'signal', 'bubble', 'literacy', 'results'];
    const currentIndex = phases.indexOf(gamePhase);
    if (currentIndex < phases.length - 1) {
      setGamePhase(phases[currentIndex + 1]);
    }
  }, [gamePhase]);
  
  const resetGame = useCallback(() => {
    setGamePhase('intro');
    setGameData({
      user: null,
      signalRecognition: {
        colorBlindnessResults: [],
        acuityResults: [],
        smallestCorrectSize: null
      },
      bubbleGame: {
        rounds: [],
        totalBubbles: 0,
        poppedBubbles: 0
      },
      literacyQuiz: {
        answers: [],
        totalQuestions: 0,
        correctAnswers: 0,
        timeSpent: 0
      }
    });
    setCurrentUser(null);
    setGameResults(null);
  }, []);
  
  return {
    gamePhase,
    setGamePhase,
    gameData,
    updateGameData,
    currentUser,
    setCurrentUser,
    gameResults,
    setGameResults,
    nextPhase,
    resetGame
  };
};

export const useTimer = (initialTime = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10); // Update every 10ms for precision
      }, 10);
    }
  }, [isRunning]);
  
  const stop = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning]);
  
  const reset = useCallback((newTime = 0) => {
    stop();
    setTime(newTime);
  }, [stop]);
  
  const restart = useCallback((newTime = 0) => {
    reset(newTime);
    start();
  }, [reset, start]);
  
  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    restart,
    formattedTime: `${Math.floor(time / 60000)}:${Math.floor((time % 60000) / 1000).toString().padStart(2, '0')}.${Math.floor((time % 1000) / 10).toString().padStart(2, '0')}`
  };
};

export const useScore = () => {
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  
  const addAttempt = useCallback((isCorrect = false) => {
    setAttempts(prev => prev + 1);
    if (isCorrect) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
    }
    
    // Update accuracy
    setAccuracy(prev => {
      const newAttempts = attempts + 1;
      const newCorrect = correct + (isCorrect ? 1 : 0);
      return newAttempts > 0 ? Math.round((newCorrect / newAttempts) * 100) : 100;
    });
  }, [attempts, correct]);
  
  const reset = useCallback(() => {
    setScore(0);
    setAccuracy(100);
    setAttempts(0);
    setCorrect(0);
  }, []);
  
  return {
    score,
    accuracy,
    attempts,
    correct,
    addAttempt,
    reset
  };
};
