import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router';
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import { createPinia } from 'pinia';

const app = createApp(App);
const pinia = createPinia();

const toastOptions = {
    // You can customize these
    position: "bottom-center",
    timeout: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    showCloseButtonOnHover: false,
    maxToasts: 3
};

app.use(router);
app.use(Toast, toastOptions);
app.use(pinia);
app.mount('#app');