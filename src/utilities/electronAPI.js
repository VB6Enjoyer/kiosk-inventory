export const electronAPI = {
    openCalculator: () => {
        if (window.electron?.openCalculator) {
            return window.electron.openCalculator();
        }
        console.warn('Electron API not available, running in browser mode');
        return Promise.resolve(false);
    },
    closeCalculator: () => {
        if (window.electron?.closeCalculator) {
            return window.electron.closeCalculator();
        }
        console.warn('Electron API not available, running in browser mode');
        return Promise.resolve(false);
    },
    minimizeCalculator: () => {
        if (window.electron?.minimizeCalculator) {
            return window.electron.minimizeCalculator();
        }
        console.warn('Electron API not available, running in browser mode');
        return Promise.resolve(false);
    },
    closeApp: () => {
        if (window.electron?.closeApp) {
            return window.electron.closeApp();
        }
        console.warn('Electron API not available, running in browser mode');
        return Promise.resolve(false);
    }
};