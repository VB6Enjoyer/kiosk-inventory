import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from "fs"
import os from 'os';

// Set up Lowdb
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');
const isDev = !app.isPackaged;

// Create the file if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ products: [], theme: 'dark' }));
}

const adapter = new JSONFile('db.json');
const defaultData = { products: [], theme: 'dark' };
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
        width: 330,
        height: 520,
        title: 'Calculadora',
        frame: false, // Remove the standard window frame
        roundedCorners: true,
        autoHideMenuBar: true,
        resizable: false, // Prevent resizing
        transparent: true,
        alwaysOnTop: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            contextIsolation: true,
            nodeIntegration: false
        },
        parent: null,
        modal: false // Change to false for better usability
    });

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

ipcMain.handle('close-app', async () => {
    if (mainWindow) {
        mainWindow.close();
    }
    return true;
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

ipcMain.handle('get-theme', async () => {
    await db.read();
    return db.data.theme;
});

ipcMain.handle('change-theme', async (event, theme) => {
    await db.read();
    db.data.theme = theme;
    await db.write();
    return db.data.theme;
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

ipcMain.handle('about', async () => {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const buildDate = new Date('2025-05-28');
    const now = new Date();
    const daysAgo = Math.floor((now - buildDate) / (1000 * 60 * 60 * 24));

    dialog.showMessageBox({
        type: 'info',
        title: 'Acerca de',
        message: `Sistema de gestión de inventario`,
        detail: `Version: ${packageJson.version}
Fecha: ${buildDate.toISOString().split('T')[0]} (hace ${daysAgo} días)
electron: ${process.versions.electron}
vue: ${packageJson.dependencies.vue.replace("^", "")}
chrome: ${process.versions.chrome}
node: ${process.versions.node}
v8: ${process.versions.v8}
OS: ${os.type()} ${os.arch()} ${os.release()}\n
Desarrollado por J. I. Núñez (juaninun17@gmail.com).`
    });

    let helpFilePath;
    if (!app.isPackaged) {
        helpFilePath = path.join(__dirname, './src/assets/help/ayuda.html');
    } else {
        helpFilePath = path.join(__dirname, 'assets/help/ayuda.html');
    }

    await shell.openPath(helpFilePath);
    return true;
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});