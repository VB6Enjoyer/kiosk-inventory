import { defineStore } from 'pinia'

export const useCurrentlyOpenModalStore = defineStore('openModal', {
    state: () => ({
        isModalOpen: false
    }),
    actions: {
        setModalOpen() {
            this.isModalOpen = true;
        },
        setModalClosed() {
            this.isModalOpen = false;
        }
    }
});