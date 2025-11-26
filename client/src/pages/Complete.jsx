import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useStore from '../state/store';

const Complete = () => {
  const navigate = useNavigate();
  const completedModules = useStore((state) => state.completedModules);

  useEffect(() => {
    // Auto-redirect to home after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout title="Assessment Complete" subtitle="Thank You for Participating">
      <div className="max-w-3xl mx-auto">
        <div className="card text-center">
          <div className="text-8xl mb-6">✅</div>
          
          <h2 className="text-4xl font-bold mb-4">
            Thank You for Completing the Assessment!
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Your responses have been successfully recorded for research purposes.
          </p>

          {/* Completion Summary */}
          <div className="bg-gradient-to-r from-cyber-blue-500/20 to-cyber-purple-500/20 border border-cyber-blue-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-semibold mb-4">Modules Completed</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">👁️</div>
                <div className="text-sm text-gray-400">Perception Lab</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm text-gray-400">Reaction Lab</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-3xl mb-2">💻</div>
                <div className="text-sm text-gray-400">Knowledge Console</div>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-lg p-6 mb-8">
            <h4 className="text-lg font-semibold mb-3 text-cyan-300">
              Your Contribution Matters
            </h4>
            <p className="text-gray-300 text-sm">
              Your participation in this assessment contributes valuable data to our research. 
              All information collected is anonymous and will be used solely for research purposes 
              to better understand sensory and cognitive patterns.
            </p>
          </div>

          {/* Privacy Reminder */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-400">
              🔒 <strong>Privacy Protected:</strong> No personal identifying information has been collected. 
              Your data is stored anonymously and securely.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-lg px-8 py-3"
            >
              Return to Home
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            You will be automatically redirected to the home page in a few seconds...
          </p>
        </div>

        {/* Additional Information */}
        <div className="card mt-6 bg-purple-900/20 border-purple-500/30">
          <h3 className="text-xl font-bold mb-3">What Happens Next?</h3>
          <ul className="text-gray-300 space-y-2 text-left">
            <li className="flex items-start">
              <span className="text-cyber-purple-400 mr-2">•</span>
              <span>Your data has been securely stored in our research database</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyber-purple-400 mr-2">•</span>
              <span>Researchers will analyze the collected data to identify patterns and insights</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyber-purple-400 mr-2">•</span>
              <span>All data remains anonymous and is used exclusively for research purposes</span>
            </li>
            <li className="flex items-start">
              <span className="text-cyber-purple-400 mr-2">•</span>
              <span>Results may contribute to improving digital accessibility and user experience design</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Complete;

