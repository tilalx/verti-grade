import API from './config';

// API method to handle login
export const loginUser = async (email, password) => {
  try {
    const response = await API.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};