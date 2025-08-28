const { app, BrowserWindow, ipcMain } = require('electron')
const { io } = require('socket.io-client')
const model = require('./src/model/model')

const socket = io(process.env.WS) // Sesuaikan dengan port server Anda
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

    socket.on('updateQueue', (response) => {
        if (mainWindow) {
            if (response.location == 'apotek cmu') {
                mainWindow.webContents.send('queueUpdated', response)
            }
        }
    })

    socket.on('updateQueueLists', (response) => {
        if (mainWindow) {
            console.log(response)
            if (response.location == 'apotek cmu') {
                mainWindow.webContents.send('queueUpdateListed', response)
            }
        }
    })

    ipcMain.handle('get-queues', async () => {
        return await model.getQueues()
    })
    
    ipcMain.handle('get-newest-queue', async () => {
        return await model.getNewestQueue()
    })

    ipcMain.handle('get-now-queue', async () => {
        return await model.getNowQueue()
    })

    ipcMain.handle('get-total-queues', async () => {
        return await model.getTotalQueues()
    })

    ipcMain.handle('get-total-done-queues', async () => {
        return await model.getTotalDoneQueues()
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