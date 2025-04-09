import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from "fs"

// Set up Lowdb
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');
const isDev = !app.isPackaged;

// Create the file if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ products: [] }));
}

const adapter = new JSONFile('db.json');
const defaultData = { products: [] };
const db = new Low(adapter, defaultData);

let mainWindow;

async function createWindow() {
    await db.read();
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173'); // Vite dev server
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// IPC handlers for saving and loading items
ipcMain.handle('save-product', async (event, newProduct) => {
    await db.read();
    db.data.products.push(newProduct);
    await db.write();
    return db.data.products;
});

ipcMain.handle('load-products', async () => {
    await db.read();
    return db.data.products;
});

ipcMain.handle('delete-product', async (event, id) => {
    await db.read();
    db.data.products = db.data.products.filter(product => product.id !== id);
    await db.write();
});

ipcMain.handle('update-product', async (event, updatedProduct) => {
    await db.read();
    const index = db.data.products.findIndex(product => product.id === updatedProduct.id);
    if (index !== -1) {
        db.data.products[index] = updatedProduct;
        await db.write();
    }
    return db.data.products;
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
