import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interaction Logging (Global)
export const logInteraction = async (interactionData) => {
  try {
    const response = await api.post('/logs/interaction', interactionData);
    return response.data;
  } catch (error) {
    console.error('Error logging interaction:', error);
    throw error;
  }
};

export const logInteractionBatch = async (interactions) => {
  try {
    const response = await api.post('/logs/batch', { interactions });
    return response.data;
  } catch (error) {
    console.error('Error logging interaction batch:', error);
    throw error;
  }
};

// Motor Skills Interaction Logging
export const logMotorSkillsInteraction = async (interactionData) => {
  try {
    const response = await api.post('/motor-skills/interaction', interactionData);
    return response.data;
  } catch (error) {
    console.error('Error logging motor skills interaction:', error);
    throw error;
  }
};

export const logMotorSkillsBatch = async (interactions) => {
  try {
    const response = await api.post('/motor-skills/batch', { interactions });
    return response.data;
  } catch (error) {
    console.error('Error logging motor skills batch:', error);
    throw error;
  }
};

// Session Management
export const createSession = async (sessionData) => {
  try {
    const response = await api.post('/results/session', sessionData);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Vision Results
export const saveVisionResults = async (resultsData) => {
  try {
    const response = await api.post('/results/vision', resultsData);
    return response.data;
  } catch (error) {
    console.error('Error saving vision results:', error);
    throw error;
  }
};

// Literacy Results
export const saveLiteracyResults = async (resultsData) => {
  try {
    const response = await api.post('/results/literacy', resultsData);
    return response.data;
  } catch (error) {
    console.error('Error saving literacy results:', error);
    throw error;
  }
};

// Get Session Results
export const getSessionResults = async (sessionId) => {
  try {
    const response = await api.get(`/results/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session results:', error);
    throw error;
  }
};

// Update Session Module Completion
export const updateModuleCompletion = async (sessionId, moduleName) => {
  try {
    const response = await api.post('/results/module-complete', {
      sessionId,
      moduleName,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating module completion:', error);
    throw error;
  }
};

export default api;

