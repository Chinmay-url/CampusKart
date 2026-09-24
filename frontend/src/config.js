// Configuration file for API and asset URLs

// Get base URL from environment or use default
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    // Extract base URL from API URL (remove /api)
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  return 'http://localhost:5000';
};

export const BASE_URL = getBaseURL();
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// Helper function to get full image URL
export const getImageURL = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

console.log('Config loaded:', { BASE_URL, API_URL, SOCKET_URL });

export default { BASE_URL, API_URL, SOCKET_URL, getImageURL };
