import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import theme from './plugins/theme';
import '@mdi/font/css/materialdesignicons.min.css';
import { createI18n } from 'vue-i18n';
import messages from '@/plugins/messages';

const userLanguage = (navigator.language || navigator.userLanguage).split('-')[0];


if (window.console) {
  window.console.log('Welcome to Verti-Grade!');
  window.console.log('If you are interested in contributing to the project, please contanct me');
  window.console.warn('Dont execute any code here unless you know what you are doing!')
  
}

const i18n = createI18n({
  locale: userLanguage,
  fallbackLocale: 'en',
  messages,
});

const vuetify = createVuetify({
  components,
  directives,
  ...theme,
  icons: {
    iconfont: 'mdi', // specify icon font
  },
});

const app = createApp(App);

// Use plugins
app.use(vuetify);
app.use(router);
app.use(store);
app.use(i18n);
app.mount('#app');
