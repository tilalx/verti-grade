const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Proxy to your backend server
        changeOrigin: true,
      }
    }
  },

  productionSourceMap: false, // Disable source maps in production
});
