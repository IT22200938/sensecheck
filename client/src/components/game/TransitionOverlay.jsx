import { useEffect, useState } from 'react';
import { useGame, PROFILE_TRAITS } from '../../context/GameContext';

const TransitionOverlay = () => {
  const { state } = useGame();
  const [animationPhase, setAnimationPhase] = useState('entering');
  
  useEffect(() => {
    if (state.showingTransition) {
      setAnimationPhase('entering');
      setTimeout(() => setAnimationPhase('showing'), 100);
      setTimeout(() => setAnimationPhase('exiting'), 1700);
    }
  }, [state.showingTransition]);
  
  if (!state.showingTransition) return null;
  
  // Find the newly unlocked trait
  const latestTrait = state.unlockedTraits[state.unlockedTraits.length - 1];
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        animationPhase === 'entering' ? 'opacity-0' : 
        animationPhase === 'exiting' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: 'var(--primary-color)',
              opacity: 0.3,
              animationDelay: `${Math.random() * 1}s`,
              animationDuration: '1.5s'
            }}
          />
        ))}
      </div>
      
      {/* Central content */}
      <div className={`text-center transform transition-all duration-500 ${
        animationPhase === 'showing' ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'
      }`}>
        {/* Trait icon with glow */}
        {latestTrait && (
          <div className="relative mb-6">
            <div 
              className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl shadow-2xl"
              style={{ 
                backgroundColor: 'rgba(var(--primary-color-rgb), 0.2)',
                border: '2px solid var(--primary-color)',
                boxShadow: '0 0 60px var(--primary-color-glow)'
              }}
            >
              {latestTrait.icon}
            </div>
            
            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-32 h-32 rounded-2xl animate-ping"
                style={{ 
                  border: '2px solid var(--primary-color)',
                  opacity: 0.3,
                  animationDuration: '1s'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Text */}
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--primary-color)' }}>
            New Skill!
          </p>
          <h2 className="text-3xl font-black text-white">
            {state.transitionMessage}
          </h2>
          {latestTrait && (
            <p className="text-gray-400 max-w-xs mx-auto">
              {latestTrait.description}
            </p>
          )}
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Object.values(PROFILE_TRAITS).map((trait, index) => {
            const isUnlocked = state.unlockedTraits.some(t => t.id === trait.id);
            return (
              <div
                key={trait.id}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isUnlocked ? 'scale-100' : 'scale-75 opacity-30'
                }`}
                style={{ 
                  backgroundColor: isUnlocked ? 'var(--primary-color)' : '#374151',
                  boxShadow: isUnlocked ? '0 0 10px var(--primary-color-glow)' : 'none'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransitionOverlay;

