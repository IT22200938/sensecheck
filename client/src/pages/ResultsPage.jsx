import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ResultsPage = ({ gameState }) => {
  const navigate = useNavigate();
  const results = gameState.gameResults;
  
  
  useEffect(() => {
    if (!results || !gameState.currentUser) {
      navigate('/');
    }
  }, [results, gameState.currentUser, navigate]);
  
  if (!results || !gameState.currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-cyber-red text-xl font-cyber mb-4">
            ACCESS DENIED
          </div>
          <p className="text-gray-400">No assessment data found.</p>
        </div>
      </div>
    );
  }
  
  const { scores } = results;
  
  const getAssessmentColor = (assessment) => {
    switch (assessment) {
      case 'Excellent': return 'text-cyber-green';
      case 'Good': return 'text-cyber-blue';
      case 'Fair': return 'text-cyber-yellow';
      case 'Needs Attention': return 'text-cyber-red';
      case 'Requires Training': return 'text-cyber-red';
      default: return 'text-gray-400';
    }
  };
  
  const getScoreColor = (score) => {
    if (typeof score === 'string') {
      // Acuity score
      return score === '20/20' ? 'text-cyber-green' :
             score === '20/25' ? 'text-cyber-blue' :
             score === '20/30' ? 'text-cyber-yellow' : 'text-cyber-red';
    }
    
    // Numeric score
    if (score >= 90) return 'text-cyber-green';
    if (score >= 75) return 'text-cyber-blue';
    if (score >= 60) return 'text-cyber-yellow';
    return 'text-cyber-red';
  };
  
  const handleRestart = () => {
    gameState.resetGame();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-cyber font-bold mb-4 text-cyber-blue text-shadow-glow">
            ASSESSMENT COMPLETE
          </h1>
          <h2 className="text-xl font-cyber text-cyber-purple mb-2">
            OPERATOR CERTIFICATION RESULTS
          </h2>
          <p className="text-gray-400">
            Mission Control Operator: {gameState.currentUser.name}
          </p>
        </div>
        
        {/* Overall Assessment */}
        <div className="cyber-panel p-8 mb-8 text-center">
          <h3 className="text-2xl font-cyber text-cyber-green mb-4">
            OVERALL ASSESSMENT
          </h3>
          <div className={`text-4xl font-cyber font-bold mb-4 ${getAssessmentColor(scores.overallAssessment)}`}>
            {scores.overallAssessment.toUpperCase()}
          </div>
          <p className="text-gray-300">
            {scores.overallAssessment === 'Excellent' && 'Outstanding performance across all assessment criteria. Cleared for immediate mission deployment.'}
            {scores.overallAssessment === 'Good' && 'Strong performance with minor areas for improvement. Approved for mission deployment.'}
            {scores.overallAssessment === 'Fair' && 'Adequate performance with some areas requiring attention. Limited mission clearance granted.'}
            {scores.overallAssessment === 'Needs Attention' && 'Performance indicates areas requiring immediate attention before mission deployment.'}
            {scores.overallAssessment === 'Requires Training' && 'Additional training required before mission deployment can be considered.'}
          </p>
        </div>
        
        {/* Detailed Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Visual Perception */}
          <div className="cyber-panel p-6">
            <h4 className="text-xl font-cyber text-cyber-blue mb-4">
              👁️ VISUAL PERCEPTION
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Color Vision:</span>
                <span className={`font-cyber ${getScoreColor(scores.colorVisionScore)}`}>
                  {scores.colorVisionScore}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Visual Acuity:</span>
                <span className={`font-cyber ${getScoreColor(scores.acuityScore)}`}>
                  {scores.acuityScore}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-dark-bg/50 rounded text-sm text-gray-400">
              {scores.colorVisionScore >= 80 && scores.acuityScore === '20/20' 
                ? 'Excellent visual capabilities detected.'
                : scores.colorVisionScore >= 60
                ? 'Good visual performance with minor variations.'
                : 'Visual capabilities may require corrective measures.'}
            </div>
          </div>
          
          {/* Motor Coordination */}
          <div className="cyber-panel p-6">
            <h4 className="text-xl font-cyber text-cyber-yellow mb-4">
              ⚡ MOTOR COORDINATION
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Accuracy:</span>
                <span className={`font-cyber ${getScoreColor(scores.motorScore.accuracy)}`}>
                  {scores.motorScore.accuracy}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Reaction Trend:</span>
                <span className="font-cyber text-cyber-blue">
                  {scores.motorScore.reactionTrend.length > 0 
                    ? (scores.motorScore.reactionTrend[scores.motorScore.reactionTrend.length - 1] < 
                       scores.motorScore.reactionTrend[0] ? '↗️ Improving' : '↘️ Stable')
                    : 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-dark-bg/50 rounded text-sm text-gray-400">
              {scores.motorScore.accuracy >= 80
                ? 'Excellent motor coordination and reaction time.'
                : scores.motorScore.accuracy >= 60
                ? 'Good motor skills with room for improvement.'
                : 'Motor coordination requires additional training.'}
            </div>
          </div>
          
          {/* Computer Literacy */}
          <div className="cyber-panel p-6">
            <h4 className="text-xl font-cyber text-cyber-purple mb-4">
              🖥️ SYSTEM KNOWLEDGE
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Interface Literacy:</span>
                <span className={`font-cyber ${getScoreColor(scores.literacyScore)}`}>
                  {scores.literacyScore}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Knowledge Level:</span>
                <span className="font-cyber text-cyber-green">
                  {scores.literacyScore >= 80 ? 'Advanced' :
                   scores.literacyScore >= 60 ? 'Intermediate' : 'Beginner'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-dark-bg/50 rounded text-sm text-gray-400">
              {scores.literacyScore >= 80
                ? 'Excellent system interface knowledge.'
                : scores.literacyScore >= 60
                ? 'Good system knowledge with minor gaps.'
                : 'Additional system training recommended.'}
            </div>
          </div>
          
          {/* Mission Readiness */}
          <div className="cyber-panel p-6">
            <h4 className="text-xl font-cyber text-cyber-green mb-4">
              🚀 MISSION READINESS
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Clearance Level:</span>
                <span className={`font-cyber ${getAssessmentColor(scores.overallAssessment)}`}>
                  {scores.overallAssessment === 'Excellent' ? 'ALPHA' :
                   scores.overallAssessment === 'Good' ? 'BETA' :
                   scores.overallAssessment === 'Fair' ? 'GAMMA' : 'RESTRICTED'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Deployment Status:</span>
                <span className="font-cyber text-cyber-blue">
                  {['Excellent', 'Good'].includes(scores.overallAssessment) ? 'APPROVED' : 'PENDING'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-dark-bg/50 rounded text-sm text-gray-400">
              Assessment completed successfully. Results archived in operator database.
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="text-center space-x-4">
          <button
            onClick={handleRestart}
            className="cyber-button px-8 py-3"
          >
            NEW ASSESSMENT
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-transparent border-2 border-cyber-purple text-cyber-purple px-8 py-3 font-cyber font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-cyber-purple hover:text-dark-bg"
          >
            PRINT CERTIFICATE
          </button>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm font-mono">
          <p>MISSION CONTROL ASSESSMENT SYSTEM v2.1.0</p>
          <p>Assessment ID: {results.resultId}</p>
          <p>Completed: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;