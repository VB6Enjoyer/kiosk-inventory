import { defineStore } from 'pinia'

export const useEcoModeStore = defineStore('ecoMode', {
    state: () => ({
        ecoMode: false
    }),
    actions: {
        toggleEcoMode() {
            this.ecoMode = !this.ecoMode;
        },
        setEcoMode(val: boolean) {
            this.ecoMode = val;
        }
    }
});