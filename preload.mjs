const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    saveProduct: (newProduct) => ipcRenderer.invoke('save-product', newProduct),
    loadProducts: () => ipcRenderer.invoke('load-products'),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
    updateProduct: (updatedProduct) => ipcRenderer.invoke('update-product', updatedProduct),
    getTheme: () => ipcRenderer.invoke('get-theme'),
    changeTheme: (theme) => ipcRenderer.invoke('change-theme', theme)
});

contextBridge.exposeInMainWorld('electron', {
    openCalculator: () => ipcRenderer.invoke('open-calculator'),
    closeCalculator: () => ipcRenderer.invoke('close-calculator'),
    minimizeCalculator: () => ipcRenderer.invoke('minimize-calculator'),
    closeApp: () => ipcRenderer.invoke('close-app')
})