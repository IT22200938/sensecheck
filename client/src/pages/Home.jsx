import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UserInfoModal from '../components/UserInfoModal';
import useStore from '../state/store';

const Home = () => {
  const navigate = useNavigate();
  const completedModules = useStore((state) => state.completedModules);
  const loadSessionData = useStore((state) => state.loadSessionData);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfoCollected, setUserInfoCollected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load session data and check if user info has been collected
  useEffect(() => {
    const initializeSession = async () => {
      // Load session data from backend
      console.log('🏠 Home page: Loading session data...');
      await loadSessionData();
      
      // Check if user info has been collected in this session
      const infoCollected = sessionStorage.getItem('sensecheck_user_info_collected');
      if (infoCollected === 'true') {
        setUserInfoCollected(true);
      } else {
        setShowUserInfoModal(true);
      }
      
      setLoading(false);
    };
    
    initializeSession();
  }, [loadSessionData]);
  
  // Reload session data when returning to this page (in case modules were completed)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        console.log('🔄 Page visible again, reloading session data...');
        loadSessionData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadSessionData, loading]);

  const handleUserInfoSubmit = (formData) => {
    sessionStorage.setItem('sensecheck_user_info_collected', 'true');
    sessionStorage.setItem('sensecheck_user_age', formData.age);
    sessionStorage.setItem('sensecheck_user_gender', formData.gender);
    setUserInfoCollected(true);
  };

  const handleModuleClick = (path) => {
    if (!userInfoCollected) {
      setShowUserInfoModal(true);
    } else {
      navigate(path);
    }
  };

  const modules = [
    {
      id: 'perception',
      name: 'Perception Lab',
      description: 'Visual impairment detection through color blindness and visual acuity tests',
      icon: '👁️',
      color: 'from-blue-500 to-blue-700',
      tests: [
        { name: 'Color Blindness Test', path: '/perception/color-blindness' },
        { name: 'Visual Acuity Test', path: '/perception/visual-acuity' },
      ],
    },
    {
      id: 'reaction',
      name: 'Reaction Lab',
      description: 'Motor skill assessment through interactive bubble-pop game',
      icon: '🎯',
      color: 'from-purple-500 to-purple-700',
      tests: [
        { name: 'Motor Skills Game', path: '/reaction/motor-skills' },
      ],
    },
    {
      id: 'knowledge',
      name: 'Knowledge Console',
      description: 'Computer literacy evaluation through interactive quiz',
      icon: '💻',
      color: 'from-cyan-500 to-cyan-700',
      tests: [
        { name: 'Literacy Quiz', path: '/knowledge/literacy' },
      ],
    },
  ];

  const isModuleCompleted = (moduleName) => {
    return completedModules.some((m) => m.moduleName === moduleName || m.name === moduleName);
  };

  if (loading) {
    return (
      <Layout showHome={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-400">Loading session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <UserInfoModal 
        isOpen={showUserInfoModal}
        onClose={() => setShowUserInfoModal(false)}
        onSubmit={handleUserInfoSubmit}
      />
      
      <Layout showHome={false}>
        {/* Hero Section */}
      <div className="text-center mb-12 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-cyber">
            Welcome, Digital Navigator
          </span>
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          You are entering the Sensecheck Facility, a futuristic digital research lab designed
          to assess sensory perception, motor skills, and cognitive abilities. Complete the
          three simulation chambers below to finish your assessment.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {modules.map((module) => {
          const completed = isModuleCompleted(module.id);
          
          return (
            <div
              key={module.id}
              className={`card transition-all duration-300 ${
                completed 
                  ? 'border-green-500 opacity-75' 
                  : 'hover:border-cyber-blue-500 transform hover:-translate-y-2'
              }`}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{module.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{module.name}</h3>
                <p className="text-gray-400 text-sm">{module.description}</p>
              </div>

              <div className="space-y-3">
                {module.tests.map((test) => (
                  <button
                    key={test.path}
                    onClick={() => !completed && handleModuleClick(test.path)}
                    disabled={completed}
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${module.color} transition-all duration-300 shadow-lg ${
                      completed 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:opacity-90'
                    }`}
                  >
                    {test.name}
                  </button>
                ))}
              </div>

              {completed && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-green-400 text-sm font-semibold bg-green-900/20 px-4 py-2 rounded-lg">
                    <span className="text-lg">✓</span>
                    <span>Completed</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="card max-w-4xl mx-auto mt-12">
        <h3 className="text-2xl font-bold mb-4 text-center">Instructions</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start">
            <span className="text-cyber-blue-400 mr-3 text-xl">1.</span>
            <span>Complete each chamber in any order. Your interactions will be continuously tracked.</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyber-blue-400 mr-3 text-xl">2.</span>
            <span>Ensure you&apos;re in a quiet environment with good lighting for accurate results.</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyber-blue-400 mr-3 text-xl">3.</span>
            <span>For best results on the visual tests, sit at a comfortable viewing distance from your screen (approximately 50cm).</span>
          </li>
          <li className="flex items-start">
            <span className="text-cyber-blue-400 mr-3 text-xl">4.</span>
            <span>Take your time - accuracy is more important than speed (except in the Reaction Lab).</span>
          </li>
        </ul>
      </div>

      </Layout>
    </>
  );
};

export default Home;

