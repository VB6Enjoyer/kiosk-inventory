import { createRouter, createWebHashHistory } from 'vue-router';
import ProductListView from '../views/ProductListView.vue';
import CalculatorView from '../views/CalculatorView.vue';

const routes = [
    {
        path: '/',
        name: 'ProductListView',
        component: ProductListView
    },
    {
        path: '/calculator',
        name: 'CalculatorView',
        component: CalculatorView
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from) => {
    return true;
});

export default router;