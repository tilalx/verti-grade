import { createStore } from 'vuex';
import VuexPersistence from 'vuex-persist';

const storageName = 'verti-grade';

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  key: storageName
});

const initialState = {
  token: null
};

const store = createStore({
  state () {
    return initialState;
  },
  mutations: {
    setToken(state, token) {
      state.token = token; 
    },
    RESET_STATE(state) {
      Object.assign(state, initialState);
    },
  },
  actions: {
    increment(context) {
      context.commit('increment');
    },
    resetStore({ commit }) {
      commit('RESET_STATE');
      localStorage.removeItem(storageName);
    }
  },
  getters: {
    token: state => state.token
    
  },
  plugins: [vuexLocal.plugin]
});

export default store;
