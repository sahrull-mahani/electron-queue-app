const { app, BrowserWindow, ipcMain } = require('electron')
const model = require('../server/model')
const { io } = require('socket.io-client')

const socket = io('http://localhost:3000') // Sesuaikan dengan port server Anda
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: true,
        autoHideMenuBar: true,
        frame: false,
        focusable: true,
        icon: __dirname + '/assets/img/logo.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Untuk contoh sederhana ini
        },
    })

    mainWindow.loadFile('index.html')
    mainWindow.setFullScreen(true) // Optional: Jalankan dalam layar penuh

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    socket.on('updateQueue', (number) => {
        if (mainWindow) {
            mainWindow.webContents.send('queueUpdated', number)
        }
    })

    ipcMain.handle('get-newest-queue', async () => {
        console.log(await model.getNewestQueue())
        return await model.getNewestQueue()
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})