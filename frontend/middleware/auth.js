// middleware/auth.js
import { jwtDecode } from "jwt-decode";
import { useMainStore } from "../stores/main";
export default defineNuxtRouteMiddleware((to, from, next) => {
    function tokenValid(token) {
        try {
          const decodedToken = jwtDecode(token);
          if (!decodedToken) {
            throw new Error('Invalid token');
          }
      
          // Check if the token has an expiration time
          if (!decodedToken.exp) {
            return false;
          }
      
          const currentUnixTime = Math.floor(Date.now() / 1000); // Convert to Unix timestamp
          return currentUnixTime < decodedToken.exp;
        } catch (error) {
          console.error('Error validating token:', error);
          return false;
        }
      }
    
    const authRequired = to.meta.authRequired || false;
    const store = useMainStore();
    let token = store.getToken();
    let isTokenValid = false;

    if (token) {
        isTokenValid = tokenValid(token);
    }
    

    if (authRequired) {
        if (!isTokenValid) {
            store.resetStore();
            return navigateTo('/login');
        }
    } else if (to.name === 'Login' && isTokenValid) {
        // If already logged in, redirect to dashboard
        return navigateTo('/dashboard');
    }
});

