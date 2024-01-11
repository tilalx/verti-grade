import { createRouter, createWebHistory } from 'vue-router';

import { jwtDecode } from 'jwt-decode';
import { useStore } from 'vuex';

const routes = [
    {
        path: '/',
        name: 'Rate Routes',
        component: () => import('@/views/RoutesRatingsView.vue'),
        meta: { title: 'Rate Routes', requiresAuth: false, navbar: true },
    },
    {
        path: '/route',
        name: 'Rate Route',
        component: () => import('@/views/RouteRatingQR.vue'),
        meta: { title: 'Rate Route', requiresAuth: false, navbar: false },
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView'),
        meta: { title: 'Login', requiresAuth: false, navbar: false },
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView'),
        meta: { title: 'Dashboard', requiresAuth: true, navbar: true },
    },
    {
        path: '/user',
        name: 'User',
        component: () => import('@/views/AdminUserEditView.vue'),
        meta: { title: 'User Edit', requiresAuth: true, navbar: true },
    },
    //404 page
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: 'Not Found', requiresAuth: false},
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

router.beforeEach((to, from, next) => {
    document.title = to.meta?.title + ' - Verti-Grade' ?? 'Verti-Grade'
    const store = useStore();
    let token = store.state.token;
    let isTokenValid = false;

    if (token) {
        // Read token from json
        token = JSON.stringify(token);
        token = JSON.parse(token);
        const decodedToken = jwtDecode(token.token);
        const currentTime = Date.now() / 1000; // Convert to seconds

        if (decodedToken.exp > currentTime) {
            isTokenValid = true;
        }
    }

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isTokenValid) {
            store.state.token = null;
            next('/login');
        } else {
            next();
        }
    } else if (to.name === 'Login' && isTokenValid) {
        // If already logged in, redirect to dashboard
        next('/dashboard');
    } else {
        next();
    }
});

export default router;