export const electronAPI = {
    openCalculator: () => {
        if (window.api?.openCalculator) {
            return window.api.openCalculator();
        }
        console.warn('Electron API not available, running in browser mode');
        return Promise.resolve(false);
    }
};