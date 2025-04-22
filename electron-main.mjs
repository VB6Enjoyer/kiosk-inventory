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

let calculatorWindow;

function createCalculatorWindow() {
    // Don't create multiple instances
    if (calculatorWindow) {
        calculatorWindow.focus();
        return;
    }

    calculatorWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Calculadora',
        frame: true, // Remove the standard window frame
        roundedCorners: true,
        autoHideMenuBar: true,
        resizable: false, // Prevent resizing
        transparent: false,
        alwaysOnTop: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false
        },
        parent: mainWindow,
        modal: false // Change to false for better usability
    });

    console.log(calculatorWindow.title);
    console.log(isDev);

    if (isDev) {
        // Load the calculator route from your dev server
        calculatorWindow.loadURL('http://localhost:5173/#/calculator');
    } else {
        // For production, we need to load the same app but with the calculator route
        calculatorWindow.loadFile(path.join(__dirname, 'dist/index.html'), {
            hash: 'calculator'
        });
    }

    // Clean up when window is closed
    calculatorWindow.on('closed', () => {
        calculatorWindow = null;
    });
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
    return;
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

ipcMain.handle('open-calculator', () => {
    createCalculatorWindow();
    return true;
});

ipcMain.handle('close-calculator', () => {
    if (calculatorWindow) {
        calculatorWindow.close();
    }
    return true;
});

ipcMain.handle('minimize-calculator', () => {
    if (calculatorWindow) {
        calculatorWindow.minimize();
    }
    return true;
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});