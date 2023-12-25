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

// Import Vue I18n and messages
import { createI18n } from 'vue-i18n';
import messages from '@/plugins/messages';

const userLanguage = (navigator.language || navigator.userLanguage).split('-')[0];
console.log('userLanguage: ', userLanguage);

// Create instance of VueI18n
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
