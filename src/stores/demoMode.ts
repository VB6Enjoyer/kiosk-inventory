import { defineStore } from 'pinia'

export const useDemoModeStore = defineStore('demoMode', {
    state: () => ({
        demoMode: false,
        productLimit: 10
    }),
    actions: {
        toggleDemoMode() {
            this.demoMode = !this.demoMode;
        },
        setDemoMode(val: boolean) {
            this.demoMode = val;
        },
        setProductLimit(num: number) {
            this.productLimit = num;
        }
    }
});