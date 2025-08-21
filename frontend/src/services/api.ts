import axios from 'axios';
// import { AI_CONFIG } from '../utils/constants';
const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.status, error.config?.url);

        // Handle specific error cases
        if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
            console.warn('AI Backend not running - using mock data');
            // Return mock response for development
            return Promise.resolve({
                data: {
                    riskScore: Math.floor(Math.random() * 60) + 20,
                    liquidationProbability: Math.floor(Math.random() * 30) + 10,
                    recommendedLTV: Math.floor(Math.random() * 20) + 60,
                    riskFactors: [
                        'Market volatility exposure',
                        'Moderate LTV ratio',
                        'Single asset concentration'
                    ],
                    recommendations: [
                        'Monitor position closely',
                        'Consider diversifying collateral',
                        'Set up automated alerts'
                    ],
                    aiConfidence: Math.floor(Math.random() * 20) + 80,
                    timestamp: new Date().toISOString()
                }
            });
        }

        return Promise.reject(error);
    }
);

export default api;