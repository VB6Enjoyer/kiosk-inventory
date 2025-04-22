const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    saveProduct: (newProduct) => ipcRenderer.invoke('save-product', newProduct),
    loadProducts: () => ipcRenderer.invoke('load-products'),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
    updateProduct: (updatedProduct) => ipcRenderer.invoke('update-product', updatedProduct),
    openCalculator: () => ipcRenderer.invoke('open-calculator'),
    closeCalculator: () => ipcRenderer.invoke('close-calculator'),
    minimizeCalculator: () => ipcRenderer.invoke('minimize-calculator')
});