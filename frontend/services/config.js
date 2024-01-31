import axios from 'axios';
import { useMainStore } from '~/stores/main';  // Adjust the path as per your file structure

// Set up a default config for your HTTP client
const API = axios.create({
  timeout: 1000,
});

// Add a request interceptor
API.interceptors.request.use(
  config => {
    // Use the Pinia store
    const mainStore = useMainStore();

    // Directly access the token from the store
    const token = mainStore.getToken();
    
    if (token) {
      // If your token is an object and you need to transform it, do it here.
      // Otherwise, just set it directly.
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  error => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default API;