import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// User API functions
export const createUser = async (userData) => {
  const response = await api.post('/game/users', userData);
  return response.data;
};

// Game results API functions
export const saveGameResults = async (userId, gameData) => {
  const response = await api.post('/game/results', {
    userId,
    gameData
  });
  return response.data;
};

export const getUserResults = async (userId) => {
  const response = await api.get(`/game/users/${userId}/results`);
  return response.data;
};

export const getGameResult = async (resultId) => {
  const response = await api.get(`/game/results/${resultId}`);
  return response.data;
};

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
