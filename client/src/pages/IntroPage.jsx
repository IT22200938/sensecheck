import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../utils/api';
import { narrativeTexts } from '../utils/gameData';

const IntroPage = ({ gameState }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate form
      if (!formData.name || !formData.age || !formData.email) {
        throw new Error('All fields are required');
      }
      
      if (formData.age < 1 || formData.age > 120) {
        throw new Error('Please enter a valid age');
      }
      
      // Create user
      const response = await createUser({
        name: formData.name,
        age: parseInt(formData.age),
        email: formData.email
      });
      
      if (response.success) {
        gameState.setCurrentUser(response.data);
        gameState.updateGameData('user', response.data);
        navigate('/game');
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-cyber font-bold mb-4 text-cyber-blue text-shadow-glow animate-pulse-glow">
            {narrativeTexts.intro.title}
          </h1>
          <h2 className="text-2xl font-cyber text-cyber-purple mb-6">
            {narrativeTexts.intro.subtitle}
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
            {narrativeTexts.intro.description}
          </p>
        </div>
        
        {/* Mission briefing */}
        <div className="cyber-panel p-8 mb-8">
          <h3 className="text-xl font-cyber text-cyber-green mb-4">ASSESSMENT PROTOCOLS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 border border-dark-border rounded">
              <div className="text-2xl mb-2">👁️</div>
              <div className="text-cyber-blue font-semibold">VISUAL PERCEPTION</div>
              <div className="text-gray-400">Signal Recognition</div>
            </div>
            <div className="text-center p-4 border border-dark-border rounded">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-cyber-yellow font-semibold">MOTOR COORDINATION</div>
              <div className="text-gray-400">System Stability</div>
            </div>
            <div className="text-center p-4 border border-dark-border rounded">
              <div className="text-2xl mb-2">🖥️</div>
              <div className="text-cyber-purple font-semibold">SYSTEM KNOWLEDGE</div>
              <div className="text-gray-400">Interface Literacy</div>
            </div>
          </div>
        </div>
        
        {/* Registration form */}
        <div className="cyber-panel p-8">
          <h3 className="text-xl font-cyber text-cyber-green mb-6">OPERATOR REGISTRATION</h3>
          
          {error && (
            <div className="bg-cyber-red/20 border border-cyber-red text-cyber-red p-4 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-cyber text-gray-300 mb-2">
                OPERATOR NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="cyber-input w-full"
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-cyber text-gray-300 mb-2">
                  AGE
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="cyber-input w-full"
                  placeholder="Age"
                  min="1"
                  max="120"
                  disabled={loading}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-cyber text-gray-300 mb-2">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="cyber-input w-full"
                  placeholder="operator@mission.control"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`cyber-button w-full py-4 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'INITIALIZING...' : 'BEGIN ASSESSMENT'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm font-mono">
          <p>MISSION CONTROL SYSTEM v2.1.0</p>
          <p>AUTHORIZED PERSONNEL ONLY</p>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
