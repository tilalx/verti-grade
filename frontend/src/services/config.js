import axios from 'axios';
import store from '../store';

// Set up a default config for your HTTP client
const API = axios.create({
  timeout: 1000,
});

// Add a request interceptor
API.interceptors.request.use(
  config => {
    let token = store.state.token;

    if (token) {
        // Read token from json
        token = JSON.stringify(token);
        token = JSON.parse(token);
        config.headers.Authorization = `${token.token}`;
    }
    return config;
  },
  error => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default API;